/** @jest-environment node */
import { orderService } from "@/entities/order/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { retryPayment } from "./actions";
import { readPaymentContext, writePaymentContext } from "./payment-context";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/order/service", () => ({ orderService: { getMine: jest.fn(), createPayment: jest.fn() } }));
jest.mock("./payment-context", () => ({ readPaymentContext: jest.fn(), writePaymentContext: jest.fn() }));

const mockSession = jest.mocked(getSessionUser);
const mockGetMine = jest.mocked(orderService.getMine);
const mockCreatePayment = jest.mocked(orderService.createPayment);
const mockReadContext = jest.mocked(readPaymentContext);
const mockWriteContext = jest.mocked(writePaymentContext);

const user: SessionUser = { id: "u-1", email: "a@example.com", full_name: "A", role: "user", avatar_url: null };
const pendingPayos = { id: "o-1", status: "pending" as const, total: 1, payment_method: null, payment_status: "pending" as const };
const payosContext = { orderId: "o-1", paymentId: "pay-1", method: "payos" as const };

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  mockGetMine.mockResolvedValue(pendingPayos);
  mockReadContext.mockResolvedValue(payosContext);
  mockCreatePayment.mockResolvedValue({ id: "pay-1", checkout_url: "https://pay.payos.vn/web/new" });
});
afterEach(() => jest.clearAllMocks());

describe("retryPayment — Thanh toán lại", () => {
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
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it.each(["paid", "shipped"] as const)("đơn %s không cần thanh toán lại", async (status) => {
    mockGetMine.mockResolvedValue({ ...pendingPayos, status });
    expect(await retryPayment({ orderId: "o-1" })).toEqual({ ok: false, message: "Đơn hàng này không cần thanh toán lại" });
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it.each(["cancelled", "failed", "processing"] as const)("đơn %s không còn chờ thanh toán: báo đặt lại, không gọi backend", async (status) => {
    mockGetMine.mockResolvedValue({ ...pendingPayos, status });
    expect(await retryPayment({ orderId: "o-1" })).toEqual({ ok: false, message: "Đơn hàng không còn chờ thanh toán. Vui lòng đặt lại." });
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it("đơn COD (theo cookie) không cần thanh toán lại", async () => {
    mockReadContext.mockResolvedValue({ ...payosContext, method: "cod" });
    expect(await retryPayment({ orderId: "o-1" })).toEqual({ ok: false, message: "Đơn hàng này không cần thanh toán lại" });
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it("đơn pending: tạo lại giao dịch PayOS, nhớ paymentId, trả link mới", async () => {
    expect(await retryPayment({ orderId: "o-1" })).toEqual({ ok: true, data: { redirectTo: "https://pay.payos.vn/web/new" } });
    expect(mockCreatePayment).toHaveBeenCalledWith("o-1", "payos");
    expect(mockWriteContext).toHaveBeenCalledWith({ orderId: "o-1", paymentId: "pay-1", method: "payos" });
  });

  it("cookie của đơn khác hoặc đã mất vẫn thanh toán lại được (backend là nơi kiểm)", async () => {
    mockReadContext.mockResolvedValue(null);
    expect(await retryPayment({ orderId: "o-1" })).toMatchObject({ ok: true });
    mockReadContext.mockResolvedValue({ ...payosContext, orderId: "other", method: "cod" });
    expect(await retryPayment({ orderId: "o-1" })).toMatchObject({ ok: true });
  });

  it("backend chưa tạo được link thì báo thử lại sau", async () => {
    mockCreatePayment.mockResolvedValue({ id: "pay-1", checkout_url: null });
    expect(await retryPayment({ orderId: "o-1" })).toMatchObject({ ok: false, message: expect.stringContaining("Chưa tạo được") });
  });

  it("giao dịch hiện tại chưa thất bại: backend báo 409, hiện nguyên thông báo, không ghi cookie", async () => {
    mockCreatePayment.mockRejectedValue(new ApiError(409, "Đơn hàng này đã có giao dịch thanh toán", "NT-PAY-1003"));
    expect(await retryPayment({ orderId: "o-1" })).toEqual({ ok: false, message: "Đơn hàng này đã có giao dịch thanh toán" });
    expect(mockWriteContext).not.toHaveBeenCalled();
  });
});
