/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { orderService } from "@/entities/order/service";
import { productService } from "@/entities/product/service";
import { reviewService } from "@/entities/review/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { makeProduct } from "@/lib/test-utils";
import { createReview } from "./actions";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/order/service", () => ({ orderService: { getDetailMine: jest.fn() } }));
jest.mock("@/entities/product/service", () => ({ productService: { getManyByIds: jest.fn() } }));
jest.mock("@/entities/review/service", () => ({ reviewService: { create: jest.fn() } }));
jest.mock("@/lib/api/http", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
      readonly code?: string,
    ) {
      super(message);
    }
  }
  return { ApiError };
});

const mockSession = jest.mocked(getSessionUser);
const mockOrder = jest.mocked(orderService.getDetailMine);
const mockProducts = jest.mocked(productService.getManyByIds);
const mockCreate = jest.mocked(reviewService.create);

const user: SessionUser = { id: "u-1", email: "a@example.com", full_name: "A", role: "user", avatar_url: null };
const order = {
  id: "o-1",
  status: "shipped" as const,
  total: 1,
  payment_method: "cod" as const,
  payment_status: null,
  created_at: "2026-11-25T00:00:00Z",
  items: [{ product_id: "p-asus", name: "ASUS", quantity: 1, unit_price: 1 }],
  shipping: null,
  subtotal: 1,
  shipping_fee: 0,
  discount_amount: 0,
  discount_code: null,
};
const valid = { orderId: "o-1", productId: "p-asus", rating: 5, content: "Máy chạy rất mượt, đáng tiền." };

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  mockOrder.mockResolvedValue(order);
  mockProducts.mockResolvedValue([makeProduct({ id: "p-asus", slug: "asus-vivobook-15" })]);
  mockCreate.mockResolvedValue({ id: "r-1", productId: "p-asus", authorLabel: "x", rating: 5, content: "x", createdAt: "" });
});
afterEach(() => jest.clearAllMocks());

describe("createReview", () => {
  it("khách chưa đăng nhập bị chuyển tới /login, không ghi", async () => {
    mockSession.mockResolvedValue(null);
    await expect(createReview(valid)).rejects.toThrow("REDIRECT:/login");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["thiếu số sao", { ...valid, rating: 0 }],
    ["quá 5 sao", { ...valid, rating: 6 }],
    ["số sao thập phân", { ...valid, rating: 3.5 }],
    ["nội dung quá ngắn", { ...valid, content: "ngắn" }],
    ["nội dung chỉ có khoảng trắng", { ...valid, content: "          " }],
    ["nội dung quá dài", { ...valid, content: "a".repeat(1001) }],
    ["thiếu mã đơn", { ...valid, orderId: "" }],
  ])("từ chối khi %s", async (_label, input) => {
    expect(await createReview(input)).toMatchObject({ ok: false });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("báo lỗi theo ô khi nội dung quá ngắn", async () => {
    expect(await createReview({ ...valid, content: "ngắn" })).toMatchObject({
      ok: false,
      fieldErrors: { content: expect.stringContaining("tối thiểu") },
    });
  });

  it("đơn không thuộc người dùng (hoặc không tồn tại)", async () => {
    mockOrder.mockResolvedValue(null);
    expect(await createReview(valid)).toEqual({ ok: false, message: "Không tìm thấy đơn hàng" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("đơn chưa đủ điều kiện (đang chờ xử lý)", async () => {
    mockOrder.mockResolvedValue({ ...order, status: "pending" });
    expect(await createReview(valid)).toMatchObject({ ok: false, message: expect.stringContaining("đã thanh toán") });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("sản phẩm không có trong đơn", async () => {
    expect(await createReview({ ...valid, productId: "p-khac" })).toEqual({
      ok: false,
      message: "Sản phẩm này không có trong đơn hàng",
    });
  });

  it("đã đánh giá rồi (403 NT-CAT-1007): trả thông báo của backend kèm dấu hiệu 'alreadyReviewed', không làm mới trang", async () => {
    mockCreate.mockRejectedValue(new ApiError(403, "Bạn đã đánh giá sản phẩm này rồi", "NT-CAT-1007"));
    expect(await createReview(valid)).toEqual({
      ok: false,
      message: "Bạn đã đánh giá sản phẩm này rồi",
      fieldErrors: { alreadyReviewed: "Bạn đã đánh giá sản phẩm này rồi" },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("chưa mua sản phẩm (403 NT-CAT-1006): lỗi chung của hộp thoại", async () => {
    mockCreate.mockRejectedValue(new ApiError(403, "Bạn cần mua sản phẩm này trước khi đánh giá", "NT-CAT-1006"));
    expect(await createReview(valid)).toEqual({
      ok: false,
      message: "Bạn cần mua sản phẩm này trước khi đánh giá",
      fieldErrors: { form: "Bạn cần mua sản phẩm này trước khi đánh giá" },
    });
  });

  it("lỗi backend khác chỉ trả thông báo", async () => {
    mockCreate.mockRejectedValue(new ApiError(503, "Không kết nối được máy chủ", "NT-GEN-0503"));
    expect(await createReview(valid)).toEqual({ ok: false, message: "Không kết nối được máy chủ" });
  });

  it("ghi đánh giá, cắt khoảng trắng thừa, rồi làm mới trang sản phẩm và chi tiết đơn", async () => {
    const result = await createReview({ ...valid, content: "  Máy chạy rất mượt, đáng tiền.  " });
    expect(result).toEqual({ ok: true, data: { reviewId: "r-1" } });
    expect(mockCreate).toHaveBeenCalledWith({ productId: "p-asus", rating: 5, content: "Máy chạy rất mượt, đáng tiền." });
    expect(revalidatePath).toHaveBeenCalledWith("/products/asus-vivobook-15");
    expect(revalidatePath).toHaveBeenCalledWith("/account/orders/o-1");
  });
});
