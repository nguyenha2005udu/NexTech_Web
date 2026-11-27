/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { updateUser } from "./actions";
import { SELF_UPDATE_MESSAGE } from "./user.rules";

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
const ME = "aaaaaaaa-0000-4000-8000-000000000001";
const OTHER = "cccccccc-0000-4000-8000-000000000002";

const session = (role: SessionUser["role"]): SessionUser => ({
  id: ME,
  email: "admin@nextech.local",
  full_name: "Admin",
  role,
  avatar_url: null,
});

beforeEach(() => mockSession.mockResolvedValue(session("admin")));

describe("updateUser", () => {
  it("người dùng thường (thiếu user:manage) bị chuyển sang /403, không gọi API", async () => {
    mockSession.mockResolvedValue(session("user"));
    await expect(updateUser({ id: OTHER, is_active: false })).rejects.toThrow("REDIRECT:/403");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("chưa đăng nhập bị chuyển sang trang đăng nhập", async () => {
    mockSession.mockResolvedValue(null);
    await expect(updateUser({ id: OTHER, is_active: false })).rejects.toThrow("REDIRECT:/login");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([{ is_active: false }, { role: "user" }])("tự sửa chính mình (%j) → lỗi, không gọi API", async (patch) => {
    await expect(updateUser({ id: ME, ...patch })).resolves.toEqual({ ok: false, message: SELF_UPDATE_MESSAGE });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("khoá: PUT chỉ gửi is_active rồi revalidate Người dùng + Tổng quan", async () => {
    mockFetch.mockResolvedValueOnce({ id: OTHER, role: "user", is_active: false, updated_at: "2026-11-27T00:00:00Z" });
    await expect(updateUser({ id: OTHER, is_active: false })).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/users/${OTHER}`, { method: "PUT", body: { is_active: false } });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("đổi vai trò: PUT chỉ gửi role", async () => {
    mockFetch.mockResolvedValueOnce({});
    await updateUser({ id: OTHER, role: "admin" });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/users/${OTHER}`, { method: "PUT", body: { role: "admin" } });
  });

  it.each([{ id: "u-1", role: "admin" }, { id: OTHER }, { id: OTHER, role: "root" }, null])(
    "đầu vào sai (%j) bị zod từ chối, không gọi API",
    async (input) => {
      await expect(updateUser(input)).resolves.toMatchObject({ ok: false });
      expect(mockFetch).not.toHaveBeenCalled();
    },
  );

  it("404 NT-IDN-1003 → trả nguyên câu backend, không revalidate", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy người dùng", "NT-IDN-1003"));
    await expect(updateUser({ id: OTHER, is_active: true })).resolves.toEqual({
      ok: false,
      message: "Không tìm thấy người dùng",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("lỗi không phải ApiError (lỗi lập trình) được ném tiếp", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("boom"));
    await expect(updateUser({ id: OTHER, is_active: true })).rejects.toThrow("boom");
  });
});
