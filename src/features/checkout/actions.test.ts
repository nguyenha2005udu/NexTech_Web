/** @jest-environment node */
import { addressService } from "@/entities/address/service";
import { couponService } from "@/entities/coupon/service";
import { orderService } from "@/entities/order/service";
import { productService } from "@/entities/product/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { makeProduct } from "@/lib/test-utils";
import { placeOrder } from "./actions";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/product/service", () => ({ productService: { getManyByIds: jest.fn() } }));
jest.mock("@/entities/address/service", () => ({ addressService: { getMine: jest.fn() } }));
jest.mock("@/entities/coupon/service", () => ({ couponService: { validate: jest.fn() } }));
jest.mock("@/entities/order/service", () => ({ orderService: { create: jest.fn() } }));

const mockSession = jest.mocked(getSessionUser);
const mockProducts = jest.mocked(productService.getManyByIds);
const mockAddress = jest.mocked(addressService.getMine);
const mockCreate = jest.mocked(orderService.create);
const mockValidate = jest.mocked(couponService.validate);

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
  couponCode: null,
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
    const result = await placeOrder({ ...validInput, couponCode: "nex200" });

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
    await placeOrder({ ...validInput, items: [{ productId: "p-asus", quantity: 2, price: 1 }], couponCode: "nex200" });
    expect(mockValidate).toHaveBeenCalledWith("NEX200", 29_980_000, 30_000);
  });

  it("mã freeship được gửi vào ô freeship_code", async () => {
    mockValidate.mockResolvedValue({ valid: true, code: "SHIP30", category: "free_shipping", discountAmount: 30_000 });
    await placeOrder({ ...validInput, couponCode: "ship30" });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ discount_code: null, freeship_code: "SHIP30" }));
  });

  it("PayOS chưa tạo được link: về trang kết quả để thử lại, không báo lỗi đặt hàng", async () => {
    mockCreate.mockResolvedValue({ id: ORDER_ID, status: "pending", total: 1, payment_method: "payos", checkout_url: null });
    const result = await placeOrder({ ...validInput, paymentMethod: "payos" });
    expect(result).toMatchObject({ ok: true, data: { redirectTo: `/checkout/result?orderCode=${ORDER_ID}&method=payos` } });
  });

  it("PayOS: chuyển tới link thanh toán backend trả về", async () => {
    mockCreate.mockResolvedValue({
      id: ORDER_ID,
      status: "processing",
      total: 15_020_000,
      payment_method: "payos",
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

describe("placeOrder — lỗi mã giảm giá từ backend", () => {
  it("mã lỗi NT-PRM-* gắn vào ô mã giảm giá", async () => {
    mockCreate.mockRejectedValue(new ApiError(400, "Mã giảm giá đã hết hạn", "NT-PRM-1011"));
    expect(await placeOrder({ ...validInput, couponCode: "OLD" })).toEqual({
      ok: false,
      message: "Mã giảm giá đã hết hạn",
      fieldErrors: { couponCode: "Mã giảm giá đã hết hạn" },
    });
  });
});

describe("placeOrder — thử mã giảm giá", () => {
  it("mã không hợp lệ: báo lý do của backend ở ô mã và không tạo đơn", async () => {
    mockValidate.mockResolvedValue({ valid: false, message: "Mã giảm giá không tồn tại" });
    expect(await placeOrder({ ...validInput, couponCode: "KHONGCO" })).toEqual({
      ok: false,
      message: "Mã giảm giá không tồn tại",
      fieldErrors: { couponCode: "Mã giảm giá không tồn tại" },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("backend lỗi khi thử mã trả thông báo cho người dùng", async () => {
    mockValidate.mockRejectedValue(new ApiError(503, "Không kết nối được máy chủ"));
    expect(await placeOrder({ ...validInput, couponCode: "X" })).toEqual({ ok: false, message: "Không kết nối được máy chủ" });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
