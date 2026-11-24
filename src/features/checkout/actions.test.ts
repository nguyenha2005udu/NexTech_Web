/** @jest-environment node */
import { addressService } from "@/entities/address/service";
import { couponService } from "@/entities/coupon/service";
import { orderService } from "@/entities/order/service";
import { productService } from "@/entities/product/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { makeProduct } from "@/lib/test-utils";
import { placeOrder } from "./actions";
import { SHIPPING_FEE } from "./pricing";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/product/service", () => ({ productService: { getManyByIds: jest.fn() } }));
jest.mock("@/entities/address/service", () => ({ addressService: { getMine: jest.fn() } }));
jest.mock("@/entities/coupon/service", () => ({ couponService: { findByCode: jest.fn() } }));
jest.mock("@/entities/order/service", () => ({ orderService: { create: jest.fn() } }));

const mockSession = jest.mocked(getSessionUser);
const mockProducts = jest.mocked(productService.getManyByIds);
const mockAddress = jest.mocked(addressService.getMine);
const mockCoupon = jest.mocked(couponService.findByCode);
const mockCreate = jest.mocked(orderService.create);

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
const nex200 = {
  code: "NEX200",
  description: null,
  category: "order" as const,
  discount_type: "fixed_amount" as const,
  discount_value: 200_000,
  min_order_value: 10_000_000,
  max_discount: null,
  valid_from: null,
  valid_until: null,
  is_active: true,
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
  mockCoupon.mockResolvedValue(nex200);
  mockCreate.mockImplementation(async (input) => ({
    id: ORDER_ID,
    status: "pending",
    total: input.total,
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
  it("bỏ qua giá client gửi lên, dùng giá thật của sản phẩm", async () => {
    await placeOrder({ ...validInput, items: [{ productId: "p-asus", quantity: 2, price: 1 }] });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ product_id: "p-asus", quantity: 2, unit_price: 14_990_000 }],
        subtotal: 29_980_000,
      }),
    );
  });

  it("sản phẩm không còn bán", async () => {
    mockProducts.mockResolvedValue([]);
    expect(await placeOrder(validInput)).toMatchObject({ ok: false, message: expect.stringContaining("không còn được bán") });
  });

  it("sản phẩm hết hàng", async () => {
    mockProducts.mockResolvedValue([{ ...asus, inStock: false }]);
    expect(await placeOrder(validInput)).toEqual({ ok: false, message: "ASUS Vivobook 15 đã hết hàng." });
  });

  it("địa chỉ không thuộc người dùng", async () => {
    mockAddress.mockResolvedValue(null);
    expect(await placeOrder(validInput)).toMatchObject({ ok: false, fieldErrors: { addressId: "Chọn lại địa chỉ" } });
  });

  it("mã giảm giá không tồn tại gắn lỗi vào ô mã", async () => {
    mockCoupon.mockResolvedValue(null);
    const result = await placeOrder({ ...validInput, couponCode: "khongco" });
    expect(mockCoupon).toHaveBeenCalledWith("KHONGCO");
    expect(result).toMatchObject({ ok: false, fieldErrors: { couponCode: "Mã giảm giá không tồn tại" } });
  });

  it("mã chưa đủ điều kiện đơn tối thiểu", async () => {
    mockProducts.mockResolvedValue([{ ...asus, price: 1_000_000 }]);
    const result = await placeOrder({ ...validInput, couponCode: "NEX200" });
    expect(result).toMatchObject({ ok: false, fieldErrors: { couponCode: expect.stringContaining("Đơn tối thiểu") } });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("placeOrder — tạo đơn", () => {
  it("COD có mã: gửi tổng đã tính lại và chuyển tới trang kết quả (Figma 03.04 → 03.08)", async () => {
    const result = await placeOrder({ ...validInput, couponCode: "nex200" });

    expect(mockCreate).toHaveBeenCalledWith({
      items: [{ product_id: "p-asus", quantity: 1, unit_price: 14_990_000 }],
      address_id: "addr-home",
      discount_code: "NEX200",
      payment_method: "cod",
      subtotal: 14_990_000,
      shipping_fee: SHIPPING_FEE,
      discount_amount: 200_000,
      total: 14_820_000,
    });
    expect(result).toEqual({
      ok: true,
      data: { orderId: ORDER_ID, redirectTo: `/checkout/result?orderCode=${ORDER_ID}`, productIds: ["p-asus"] },
    });
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
