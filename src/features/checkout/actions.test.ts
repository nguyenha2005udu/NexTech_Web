/** @jest-environment node */
import { addressService } from "@/entities/address/service";
import { couponService } from "@/entities/coupon/service";
import { orderService } from "@/entities/order/service";
import { productService } from "@/entities/product/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { makeProduct } from "@/lib/test-utils";
import { placeOrder, reorderItems, startPayment } from "./actions";
import { readPaymentContext, writePaymentContext } from "./payment-context";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/product/service", () => ({ productService: { getManyByIds: jest.fn() } }));
jest.mock("@/entities/address/service", () => ({ addressService: { getMine: jest.fn() } }));
jest.mock("@/entities/coupon/service", () => ({ couponService: { validate: jest.fn() } }));
jest.mock("@/entities/order/service", () => ({
  orderService: { create: jest.fn(), getMine: jest.fn(), createPayment: jest.fn(), getDetailMine: jest.fn() },
}));
jest.mock("./payment-context", () => ({ writePaymentContext: jest.fn(), readPaymentContext: jest.fn() }));

const mockSession = jest.mocked(getSessionUser);
const mockProducts = jest.mocked(productService.getManyByIds);
const mockAddress = jest.mocked(addressService.getMine);
const mockCreate = jest.mocked(orderService.create);
const mockValidate = jest.mocked(couponService.validate);
const mockWriteContext = jest.mocked(writePaymentContext);
const mockReadContext = jest.mocked(readPaymentContext);
const mockGetMine = jest.mocked(orderService.getMine);
const mockCreatePayment = jest.mocked(orderService.createPayment);
const mockGetDetail = jest.mocked(orderService.getDetailMine);

const user: SessionUser = { id: "u-1", email: "minh.anh@example.com", full_name: "Minh Anh", role: "user", avatar_url: null };
const asus = makeProduct({ id: "p-asus", name: "ASUS Vivobook 15", price: 14_990_000, inStock: true });
const home = {
  id: "addr-home",
  label: "Nhà riêng",
  recipient_name: "Minh Anh",
  phone_number: "090 000 0000",
  full_address: "123 Nguyễn Văn Cừ",
  is_default: true,
};
const ORDER_ID = "aaaaaaaa-0000-4000-8000-000000000001";

const validInput = {
  items: [{ productId: "p-asus", quantity: 1 }],
  addressId: "addr-home",
  couponCodes: [],
  paymentMethod: "cod",
};

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  mockProducts.mockResolvedValue([asus]);
  mockAddress.mockResolvedValue(home);
  mockValidate.mockResolvedValue({ valid: true, code: "NEX200", category: "order", discountAmount: 200_000 });
  mockCreate.mockImplementation(async (input) => ({
    id: ORDER_ID,
    status: "pending",
    total: 150_000,
    payment_method: input.payment_method,
    payment_id: "pay-1",
    checkout_url: null,
  }));
});

describe("placeOrder — phân quyền & đầu vào", () => {
  it("khách chưa đăng nhập bị chuyển tới /login, không tạo đơn", async () => {
    mockSession.mockResolvedValue(null);
    await expect(placeOrder(validInput)).rejects.toThrow("REDIRECT:/login");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("đơn rỗng bị từ chối với thông báo", async () => {
    const result = await placeOrder({ ...validInput, items: [] });
    expect(result).toMatchObject({ ok: false, message: "Chưa có sản phẩm nào để đặt" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["số lượng vượt giới hạn", { items: [{ productId: "p-asus", quantity: 11 }] }],
    ["sản phẩm bị lặp", { items: [{ productId: "p-asus", quantity: 1 }, { productId: "p-asus", quantity: 2 }] }],
    ["phương thức thanh toán lạ", { paymentMethod: "momo" }],
  ])("từ chối khi %s", async (_label, override) => {
    expect(await placeOrder({ ...validInput, ...override })).toMatchObject({ ok: false });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("placeOrder — kiểm dữ liệu ở server", () => {
  it("không gửi giá hay số tiền nào lên backend, kể cả khi client gửi kèm giá", async () => {
    await placeOrder({ ...validInput, items: [{ productId: "p-asus", quantity: 2, price: 1 }] });
    const [input] = mockCreate.mock.calls[0] ?? [];
    expect(input?.items).toEqual([{ product_id: "p-asus", quantity: 2 }]);
    expect(input).not.toHaveProperty("total");
    expect(input).not.toHaveProperty("subtotal");
  });

  it("sản phẩm không còn bán", async () => {
    mockProducts.mockResolvedValue([]);
    expect(await placeOrder(validInput)).toMatchObject({ ok: false, message: expect.stringContaining("không còn được bán") });
  });

  it("sản phẩm hết hàng", async () => {
    mockProducts.mockResolvedValue([{ ...asus, inStock: false }]);
    expect(await placeOrder(validInput)).toEqual({ ok: false, message: "ASUS Vivobook 15 đã hết hàng." });
  });

  it("số lượng vượt tồn kho", async () => {
    mockProducts.mockResolvedValue([{ ...asus, stockQuantity: 1 }]);
    const result = await placeOrder({ ...validInput, items: [{ productId: "p-asus", quantity: 2 }] });
    expect(result).toEqual({ ok: false, message: "ASUS Vivobook 15 chỉ còn 1 sản phẩm." });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("tồn kho bằng 0 coi như hết hàng", async () => {
    mockProducts.mockResolvedValue([{ ...asus, stockQuantity: 0 }]);
    expect(await placeOrder(validInput)).toEqual({ ok: false, message: "ASUS Vivobook 15 đã hết hàng." });
  });

  it("địa chỉ không thuộc người dùng", async () => {
    mockAddress.mockResolvedValue(null);
    expect(await placeOrder(validInput)).toMatchObject({ ok: false, fieldErrors: { addressId: "Chọn lại địa chỉ" } });
  });
});

describe("placeOrder — tạo đơn", () => {
  it("COD có mã: gửi mã (viết hoa) cho backend và chuyển tới trang kết quả kèm gợi ý phương thức", async () => {
    const result = await placeOrder({ ...validInput, couponCodes: ["nex200"] });

    expect(mockCreate).toHaveBeenCalledWith({
      items: [{ product_id: "p-asus", quantity: 1 }],
      address_id: "addr-home",
      discount_code: "NEX200",
      freeship_code: null,
      payment_method: "cod",
    });
    expect(result).toEqual({
      ok: true,
      data: { orderId: ORDER_ID, redirectTo: `/checkout/result?orderCode=${ORDER_ID}&method=cod`, productIds: ["p-asus"] },
    });
  });

  it("không nhập mã thì không gọi backend kiểm mã và cả hai ô mã là null", async () => {
    await placeOrder(validInput);
    expect(mockValidate).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ discount_code: null, freeship_code: null }));
  });

  it("thử mã với tạm tính tính lại từ giá thật, bỏ qua giá client", async () => {
    await placeOrder({ ...validInput, items: [{ productId: "p-asus", quantity: 2, price: 1 }], couponCodes: ["nex200"] });
    expect(mockValidate).toHaveBeenCalledWith("NEX200", 29_980_000, 0); // đơn từ 500.000 ₫ miễn phí ship
  });

  it("đơn dưới 500.000 ₫: gửi phí ship 30.000 ₫ khi kiểm mã", async () => {
    mockProducts.mockResolvedValue([makeProduct({ id: "p-cable", name: "Cáp sạc", price: 200_000, inStock: true })]);
    await placeOrder({ ...validInput, items: [{ productId: "p-cable", quantity: 1 }], couponCodes: ["nex200"] });
    expect(mockValidate).toHaveBeenCalledWith("NEX200", 200_000, 30_000);
  });

  it("mã freeship được gửi vào ô freeship_code", async () => {
    mockValidate.mockResolvedValue({ valid: true, code: "SHIP30", category: "free_shipping", discountAmount: 30_000 });
    await placeOrder({ ...validInput, couponCodes: ["ship30"] });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ discount_code: null, freeship_code: "SHIP30" }));
  });

  it("2 loại mã: mã giảm đơn vào discount_code, mã freeship vào freeship_code", async () => {
    mockValidate.mockImplementation(async (code) =>
      code === "SHIP30"
        ? { valid: true, code, category: "free_shipping", discountAmount: 30_000 }
        : { valid: true, code, category: "order", discountAmount: 12_000 },
    );
    await placeOrder({ ...validInput, couponCodes: ["sale10", "ship30"] });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ discount_code: "SALE10", freeship_code: "SHIP30" }));
  });

  it("2 mã cùng loại bị từ chối, không tạo đơn", async () => {
    mockValidate.mockImplementation(async (code) => ({ valid: true, code, category: "order", discountAmount: 1 }));
    expect(await placeOrder({ ...validInput, couponCodes: ["A", "B"] })).toMatchObject({
      ok: false,
      fieldErrors: { couponCodes: expect.stringContaining("1 mã giảm giá đơn hàng") },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("nhiều hơn 2 mã bị từ chối", async () => {
    expect(await placeOrder({ ...validInput, couponCodes: ["A", "B", "C"] })).toMatchObject({ ok: false });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("PayOS chưa tạo được link: về trang kết quả để thử lại, không báo lỗi đặt hàng", async () => {
    mockCreate.mockResolvedValue({ id: ORDER_ID, status: "pending", total: 1, payment_method: "payos", payment_id: null, checkout_url: null });
    const result = await placeOrder({ ...validInput, paymentMethod: "payos" });
    expect(result).toMatchObject({ ok: true, data: { redirectTo: `/checkout/result?orderCode=${ORDER_ID}&method=payos` } });
  });

  it("PayOS: chuyển tới link thanh toán backend trả về", async () => {
    mockCreate.mockResolvedValue({
      id: ORDER_ID,
      status: "processing",
      total: 15_020_000,
      payment_method: "payos",
      payment_id: "pay-1",
      checkout_url: "https://pay.payos.vn/web/abc",
    });
    const result = await placeOrder({ ...validInput, paymentMethod: "payos" });
    expect(result).toMatchObject({ ok: true, data: { redirectTo: "https://pay.payos.vn/web/abc" } });
  });

  it("lỗi backend khi tạo đơn trả về thông báo cho người dùng", async () => {
    mockCreate.mockRejectedValue(new ApiError(409, "Sản phẩm vừa hết hàng", "NT-ORD-1001"));
    expect(await placeOrder(validInput)).toEqual({ ok: false, message: "Sản phẩm vừa hết hàng" });
  });
});

describe("placeOrder — nhớ ngữ cảnh thanh toán", () => {
  it("ghi orderId, paymentId và phương thức để trang kết quả hỏi lại backend", async () => {
    await placeOrder({ ...validInput, paymentMethod: "payos" });
    expect(mockWriteContext).toHaveBeenCalledWith({ orderId: ORDER_ID, paymentId: "pay-1", method: "payos" });
  });

  it("chưa có giao dịch (đơn còn processing) thì paymentId là null", async () => {
    mockCreate.mockResolvedValue({ id: ORDER_ID, status: "processing", total: 1, payment_method: "cod", payment_id: null, checkout_url: null });
    await placeOrder(validInput);
    expect(mockWriteContext).toHaveBeenCalledWith({ orderId: ORDER_ID, paymentId: null, method: "cod" });
  });

  it("đặt đơn lỗi thì không ghi gì", async () => {
    mockCreate.mockRejectedValue(new ApiError(409, "Sản phẩm vừa hết hàng", "NT-ORD-1001"));
    await placeOrder(validInput);
    expect(mockWriteContext).not.toHaveBeenCalled();
  });
});

describe("placeOrder — lỗi mã giảm giá từ backend", () => {
  it("mã lỗi NT-PRM-* gắn vào ô mã giảm giá", async () => {
    mockCreate.mockRejectedValue(new ApiError(400, "Mã giảm giá đã hết hạn", "NT-PRM-1011"));
    expect(await placeOrder({ ...validInput, couponCodes: ["OLD"] })).toEqual({
      ok: false,
      message: "Mã giảm giá đã hết hạn",
      fieldErrors: { couponCodes: "Mã giảm giá đã hết hạn" },
    });
  });
});

describe("placeOrder — thử mã giảm giá", () => {
  it("mã không hợp lệ: báo lý do của backend ở ô mã và không tạo đơn", async () => {
    mockValidate.mockResolvedValue({ valid: false, message: "Mã giảm giá không tồn tại" });
    expect(await placeOrder({ ...validInput, couponCodes: ["KHONGCO"] })).toEqual({
      ok: false,
      message: "Mã giảm giá không tồn tại",
      fieldErrors: { couponCodes: "Mã giảm giá không tồn tại" },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("backend lỗi khi thử mã trả thông báo cho người dùng", async () => {
    mockValidate.mockRejectedValue(new ApiError(503, "Không kết nối được máy chủ"));
    expect(await placeOrder({ ...validInput, couponCodes: ["X"] })).toEqual({ ok: false, message: "Không kết nối được máy chủ" });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("startPayment — tạo giao dịch cho đơn đặt lúc backend còn processing", () => {
  const ctx = { orderId: ORDER_ID, paymentId: null, method: "payos" as const };
  const pendingOrder = { id: ORDER_ID, status: "pending" as const, total: 1, payment_method: null, payment_status: null };

  beforeEach(() => {
    mockReadContext.mockResolvedValue(ctx);
    mockGetMine.mockResolvedValue(pendingOrder);
    mockCreatePayment.mockResolvedValue({ id: "pay-7", checkout_url: "https://pay.payos.vn/web/xyz" });
  });

  it("khách chưa đăng nhập bị chuyển tới /login", async () => {
    mockSession.mockResolvedValue(null);
    await expect(startPayment({ orderId: ORDER_ID })).rejects.toThrow("REDIRECT:/login");
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it("thiếu orderId bị từ chối", async () => {
    expect(await startPayment({})).toMatchObject({ ok: false });
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it("PayOS: tạo giao dịch theo phương thức trong cookie, nhớ paymentId, trả link thanh toán", async () => {
    expect(await startPayment({ orderId: ORDER_ID })).toEqual({ ok: true, data: { redirectTo: "https://pay.payos.vn/web/xyz" } });
    expect(mockCreatePayment).toHaveBeenCalledWith(ORDER_ID, "payos");
    expect(mockWriteContext).toHaveBeenCalledWith({ ...ctx, paymentId: "pay-7" });
  });

  it("COD: tạo giao dịch, ở lại trang kết quả (không có link)", async () => {
    mockReadContext.mockResolvedValue({ ...ctx, method: "cod" });
    mockCreatePayment.mockResolvedValue({ id: "pay-8", checkout_url: null });
    expect(await startPayment({ orderId: ORDER_ID })).toEqual({ ok: true, data: { redirectTo: null } });
    expect(mockCreatePayment).toHaveBeenCalledWith(ORDER_ID, "cod");
  });

  it("PayOS chưa có link: nhớ giao dịch nhưng báo lỗi để thử lại", async () => {
    mockCreatePayment.mockResolvedValue({ id: "pay-7", checkout_url: null });
    expect(await startPayment({ orderId: ORDER_ID })).toMatchObject({ ok: false });
    expect(mockWriteContext).toHaveBeenCalledWith({ ...ctx, paymentId: "pay-7" });
  });

  it("không có cookie hoặc cookie của đơn khác thì từ chối, không gọi backend", async () => {
    mockReadContext.mockResolvedValue(null);
    expect(await startPayment({ orderId: ORDER_ID })).toMatchObject({ ok: false });
    mockReadContext.mockResolvedValue({ ...ctx, orderId: "other" });
    expect(await startPayment({ orderId: ORDER_ID })).toMatchObject({ ok: false });
    expect(mockGetMine).not.toHaveBeenCalled();
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it("đã có giao dịch thì không tạo thêm", async () => {
    mockReadContext.mockResolvedValue({ ...ctx, paymentId: "pay-1" });
    expect(await startPayment({ orderId: ORDER_ID })).toEqual({ ok: true, data: { redirectTo: null } });
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it("đơn không thuộc người dùng, hoặc không còn pending thì từ chối", async () => {
    mockGetMine.mockResolvedValue(null);
    expect(await startPayment({ orderId: ORDER_ID })).toEqual({ ok: false, message: "Không tìm thấy đơn hàng" });
    mockGetMine.mockResolvedValue({ ...pendingOrder, status: "cancelled" });
    expect(await startPayment({ orderId: ORDER_ID })).toEqual({ ok: false, message: "Đơn hàng không còn chờ thanh toán" });
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it("backend báo lỗi (vd. PayOS 503) thì trả thông báo, không ghi cookie", async () => {
    mockCreatePayment.mockRejectedValue(new ApiError(503, "Lỗi tạo link thanh toán PayOS, vui lòng thử lại", "NT-PAY-1006"));
    expect(await startPayment({ orderId: ORDER_ID })).toEqual({ ok: false, message: "Lỗi tạo link thanh toán PayOS, vui lòng thử lại" });
    expect(mockWriteContext).not.toHaveBeenCalled();
  });
});

describe("reorderItems — Đặt lại", () => {
  const detail = (items: Array<{ product_id: string; quantity: number }>) =>
    ({ id: ORDER_ID, status: "cancelled", items: items.map((i) => ({ ...i, name: "x", unit_price: 1 })) }) as never;
  const laptop = makeProduct({ id: "p-asus", slug: "asus", name: "ASUS Vivobook 15", price: 14_990_000, inStock: true, stockQuantity: 5 });
  const mouse = makeProduct({ id: "p-mouse", slug: "mouse", name: "Chuột", price: 300_000, inStock: true });

  it("khách chưa đăng nhập bị chuyển tới /login", async () => {
    mockSession.mockResolvedValue(null);
    await expect(reorderItems({ orderId: ORDER_ID })).rejects.toThrow("REDIRECT:/login");
    expect(mockGetDetail).not.toHaveBeenCalled();
  });

  it("thiếu mã đơn bị từ chối", async () => {
    expect(await reorderItems({})).toMatchObject({ ok: false });
  });

  it("đơn không thuộc người dùng (backend trả null) thì từ chối, không đọc sản phẩm", async () => {
    mockGetDetail.mockResolvedValue(null);
    expect(await reorderItems({ orderId: ORDER_ID })).toEqual({ ok: false, message: "Không tìm thấy đơn hàng" });
    expect(mockProducts).not.toHaveBeenCalled();
  });

  it("trả sản phẩm của đơn với giá và tồn kho HIỆN TẠI, số lượng như đơn cũ", async () => {
    mockGetDetail.mockResolvedValue(detail([{ product_id: "p-asus", quantity: 2 }, { product_id: "p-mouse", quantity: 1 }]));
    mockProducts.mockResolvedValue([laptop, mouse]);
    const result = await reorderItems({ orderId: ORDER_ID });
    expect(result).toEqual({
      ok: true,
      data: {
        skipped: 0,
        lines: [
          { product: expect.objectContaining({ id: "p-asus", slug: "asus", price: 14_990_000, stockQuantity: 5 }), quantity: 2 },
          { product: expect.objectContaining({ id: "p-mouse", price: 300_000 }), quantity: 1 },
        ],
      },
    });
  });

  it("chỉ trả các trường cần cho giỏ, không kèm mô tả dài hay thông số", async () => {
    mockGetDetail.mockResolvedValue(detail([{ product_id: "p-asus", quantity: 1 }]));
    mockProducts.mockResolvedValue([laptop]);
    const result = await reorderItems({ orderId: ORDER_ID });
    const product = result.ok ? result.data.lines[0]?.product : undefined;
    expect(Object.keys(product ?? {}).sort()).toEqual(["id", "images", "name", "price", "slug", "stockQuantity", "summary"]);
  });

  it("bỏ qua sản phẩm hết hàng, ngừng bán hoặc không còn, và đếm số bị bỏ", async () => {
    mockGetDetail.mockResolvedValue(
      detail([{ product_id: "p-asus", quantity: 1 }, { product_id: "p-mouse", quantity: 1 }, { product_id: "p-gone", quantity: 1 }]),
    );
    mockProducts.mockResolvedValue([{ ...laptop, stockQuantity: 0 }, { ...mouse, inStock: false }]);
    expect(await reorderItems({ orderId: ORDER_ID })).toEqual({ ok: true, data: { lines: [], skipped: 3 } });
  });
});
