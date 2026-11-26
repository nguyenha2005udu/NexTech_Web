/** @jest-environment node */
import { orderService } from "@/entities/order/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { retryPayment } from "./actions";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/order/service", () => ({ orderService: { getMine: jest.fn(), retryPayment: jest.fn() } }));

const mockSession = jest.mocked(getSessionUser);
const mockGetMine = jest.mocked(orderService.getMine);
const mockRetry = jest.mocked(orderService.retryPayment);

const user: SessionUser = { id: "u-1", email: "a@example.com", full_name: "A", role: "user", avatar_url: null };
const failedPayos = { id: "o-1", status: "failed" as const, total: 1, payment_method: "payos" as const, payment_status: "failed" as const };

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  mockGetMine.mockResolvedValue(failedPayos);
  mockRetry.mockResolvedValue({ checkout_url: "https://pay.payos.vn/web/new" });
});

describe("retryPayment", () => {
  it("khách chưa đăng nhập bị chuyển tới /login", async () => {
    mockSession.mockResolvedValue(null);
    await expect(retryPayment({ orderId: "o-1" })).rejects.toThrow("REDIRECT:/login");
  });

  it("đầu vào thiếu mã đơn bị từ chối", async () => {
    expect(await retryPayment({})).toMatchObject({ ok: false });
    expect(mockGetMine).not.toHaveBeenCalled();
  });

  it("không có đơn (hoặc đơn của người khác)", async () => {
    mockGetMine.mockResolvedValue(null);
    expect(await retryPayment({ orderId: "o-x" })).toEqual({ ok: false, message: "Không tìm thấy đơn hàng" });
  });

  it.each([
    ["đơn COD", { ...failedPayos, payment_method: "cod" as const, payment_status: null }],
    ["đơn đã thanh toán", { ...failedPayos, status: "paid" as const, payment_status: "success" as const }],
  ])("%s không cần thanh toán lại", async (_label, order) => {
    mockGetMine.mockResolvedValue(order);
    expect(await retryPayment({ orderId: "o-1" })).toEqual({ ok: false, message: "Đơn hàng này không cần thanh toán lại" });
    expect(mockRetry).not.toHaveBeenCalled();
  });

  it("trả link PayOS mới", async () => {
    expect(await retryPayment({ orderId: "o-1" })).toEqual({ ok: true, data: { redirectTo: "https://pay.payos.vn/web/new" } });
  });

  it("backend chưa tạo được link thì báo thử lại sau", async () => {
    mockRetry.mockResolvedValue({ checkout_url: null });
    expect(await retryPayment({ orderId: "o-1" })).toMatchObject({ ok: false, message: expect.stringContaining("Chưa tạo được") });
  });

  it("lỗi backend đổi thành thông báo", async () => {
    mockRetry.mockRejectedValue(new ApiError(409, "Đơn đã bị huỷ", "NT-ORD-1009"));
    expect(await retryPayment({ orderId: "o-1" })).toEqual({ ok: false, message: "Đơn đã bị huỷ" });
  });
});
