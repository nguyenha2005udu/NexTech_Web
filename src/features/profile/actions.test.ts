/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { updateProfile } from "./actions";

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
const form = { fullName: "Nguyễn Văn A", phone: "0901234567", userSegment: "Sinh viên", occupation: "CNTT", ageRange: "18-22", interests: ["laptop"] };
const user: SessionUser = { id: "u-1", email: "a@nextech.local", full_name: "A", role: "user", avatar_url: null };

beforeEach(() => mockSession.mockResolvedValue(user));

describe("updateProfile", () => {
  it("chưa đăng nhập thì chuyển sang /login, không gọi API", async () => {
    mockSession.mockResolvedValue(null);
    await expect(updateProfile(form)).rejects.toThrow("REDIRECT:/login");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("dữ liệu sai: trả lỗi theo ô, không gọi API", async () => {
    const result = await updateProfile({ ...form, phone: "abc" });
    expect(result).toMatchObject({ ok: false, fieldErrors: { phone: "Số điện thoại không hợp lệ" } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("gọi PUT /users/me rồi PUT /users/me/profile và revalidate", async () => {
    mockFetch.mockResolvedValue({});
    await expect(updateProfile(form)).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/users/me", {
      method: "PUT",
      body: { full_name: "Nguyễn Văn A", phone_number: "0901234567" },
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/users/me/profile", {
      method: "PUT",
      body: { user_segment: "Sinh viên", occupation: "CNTT", age_range: "18-22", interests: ["laptop"] },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/account/profile");
  });

  it("backend lỗi: đổi ApiError thành thông báo, không revalidate", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(403, "Tài khoản đã bị khoá", "NT-IDN-1002"));
    await expect(updateProfile(form)).resolves.toEqual({ ok: false, message: "Tài khoản đã bị khoá" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
