/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { updateOrderStatus } from "./actions";

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
const ID = "aaaaaaaa-0000-4000-8000-000000000002";

const user = (role: SessionUser["role"]): SessionUser => ({
  id: "u-1",
  email: "a@nextech.local",
  full_name: "A",
  role,
  avatar_url: null,
});

beforeEach(() => mockSession.mockResolvedValue(user("admin")));

describe("updateOrderStatus", () => {
  it("người dùng thường bị chuyển sang /403, không gọi API", async () => {
    mockSession.mockResolvedValue(user("user"));
    await expect(updateOrderStatus({ id: ID, status: "shipped" })).rejects.toThrow("REDIRECT:/403");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("khách chưa đăng nhập bị chuyển sang trang đăng nhập", async () => {
    mockSession.mockResolvedValue(null);
    await expect(updateOrderStatus({ id: ID, status: "shipped" })).rejects.toThrow("REDIRECT:/login");
  });

  it("thành công: PUT đúng body rồi revalidate bảng đơn + dashboard", async () => {
    mockFetch.mockResolvedValueOnce({ id: ID, status: "shipped" });
    await expect(updateOrderStatus({ id: ID, status: "shipped" })).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/orders/${ID}/status`, {
      method: "PUT",
      body: { status: "shipped" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it.each(["paid", "pending", "processing"])("status '%s' bị zod từ chối (admin không đặt tay)", async (status) => {
    const result = await updateOrderStatus({ id: ID, status });
    expect(result).toMatchObject({ ok: false, fieldErrors: { status: "Trạng thái không hợp lệ" } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("id sai định dạng bị từ chối", async () => {
    const result = await updateOrderStatus({ id: "../../users", status: "cancelled" });
    expect(result).toMatchObject({ ok: false, fieldErrors: { id: "Mã đơn hàng không hợp lệ" } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("chuyển sai (NT-ORD-1007) → trả nguyên câu backend, không revalidate", async () => {
    const message = 'Không thể chuyển đơn từ "pending" sang "shipped"';
    mockFetch.mockRejectedValueOnce(new ApiError(400, message, "NT-ORD-1007"));
    await expect(updateOrderStatus({ id: ID, status: "shipped" })).resolves.toEqual({ ok: false, message });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("backend chưa hỗ trợ (501) → trả thông báo backend", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(501, "Huỷ đơn từ màn quản trị chưa hỗ trợ", "NT-GEN-0500"));
    await expect(updateOrderStatus({ id: ID, status: "cancelled" })).resolves.toEqual({
      ok: false,
      message: "Huỷ đơn từ màn quản trị chưa hỗ trợ",
    });
  });
});
