/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { confirmCodPayment } from "./actions";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/lib/api/http", () => {
  const actual: typeof import("@/lib/api/http") = jest.requireActual("@/lib/api/http");
  return { ...actual, apiFetch: jest.fn() };
});

const mockSession = jest.mocked(getSessionUser);
const mockFetch = jest.mocked(apiFetch);
const ID = "bbbbbbbb-0000-4000-8000-000000000003";

const user = (role: SessionUser["role"]): SessionUser => ({
  id: "u-1",
  email: "a@nextech.local",
  full_name: "A",
  role,
  avatar_url: null,
});

beforeEach(() => mockSession.mockResolvedValue(user("admin")));

describe("confirmCodPayment", () => {
  it("người dùng thường (thiếu payment:confirm-cod) bị chuyển sang /403, không gọi API", async () => {
    mockSession.mockResolvedValue(user("user"));
    await expect(confirmCodPayment({ id: ID })).rejects.toThrow("REDIRECT:/403");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("chưa đăng nhập bị chuyển sang trang đăng nhập", async () => {
    mockSession.mockResolvedValue(null);
    await expect(confirmCodPayment({ id: ID })).rejects.toThrow("REDIRECT:/login");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("thành công: POST body rỗng rồi revalidate Thanh toán + Đơn hàng + Tổng quan", async () => {
    mockFetch.mockResolvedValueOnce({ id: ID, status: "success", paid_at: "2026-11-23T03:00:00.000Z" });
    await expect(confirmCodPayment({ id: ID })).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/payments/${ID}/confirm-cod`, { method: "POST", body: {} });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/transactions");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it.each([{ id: "PAY-BBBBBBBB" }, { id: "../../orders" }, {}, null])("id không phải UUID (%j) bị zod từ chối", async (input) => {
    const result = await confirmCodPayment(input);
    expect(result).toMatchObject({ ok: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("id sai định dạng → lỗi gắn vào ô id", async () => {
    await expect(confirmCodPayment({ id: "x" })).resolves.toMatchObject({
      ok: false,
      fieldErrors: { id: "Mã giao dịch không hợp lệ" },
    });
  });

  it.each([
    [400, "NT-PAY-1008", "Chỉ áp dụng xác nhận cho giao dịch COD"],
    [400, "NT-PAY-1009", 'Giao dịch đang ở trạng thái "success", không thể xác nhận thu tiền'],
    [404, "NT-PAY-1001", "Không tìm thấy giao dịch"],
  ])("lỗi %i %s → trả nguyên câu backend, không revalidate", async (status, code, message) => {
    mockFetch.mockRejectedValueOnce(new ApiError(status, message, code));
    await expect(confirmCodPayment({ id: ID })).resolves.toEqual({ ok: false, message });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("lỗi không phải ApiError (lỗi lập trình) được ném tiếp", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("boom"));
    await expect(confirmCodPayment({ id: ID })).rejects.toThrow("boom");
  });
});
