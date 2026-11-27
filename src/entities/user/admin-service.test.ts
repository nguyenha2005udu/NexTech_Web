/** @jest-environment node */
import { ApiError, apiFetch } from "@/lib/api/http";
import { adminUserService } from "./admin-service";

jest.mock("@/lib/api/http", () => {
  const actual: typeof import("@/lib/api/http") = jest.requireActual("@/lib/api/http");
  return { ...actual, apiFetch: jest.fn() };
});

const mockFetch = jest.mocked(apiFetch);
const ID = "cccccccc-0000-4000-8000-000000000001";

// Hình dạng body của identity-service (services/identity/src/modules/admin-profile)
const rawUser = {
  id: ID,
  full_name: "Nguyễn Văn A",
  email: "a@nextech.local",
  phone_number: null,
  avatar_url: null,
  role: "user",
  is_active: true,
  created_at: "2026-07-21T01:20:00.000Z",
};

describe("adminUserService.list", () => {
  it("đổi { data } của identity sang Paginated { items, totalPages }", async () => {
    mockFetch.mockResolvedValueOnce({ data: [rawUser], total: 21, page: 2, limit: 20 });
    const page = await adminUserService.list({ search: "an", role: "user", is_active: "true", page: 2, limit: 20 });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/users?search=an&role=user&is_active=true&page=2&limit=20");
    expect(page).toEqual({ items: [rawUser], total: 21, page: 2, limit: 20, totalPages: 2 });
  });

  it.each([
    [0, 0],
    [1, 1],
    [20, 1],
  ])("total=%i → totalPages=%i", async (total, totalPages) => {
    mockFetch.mockResolvedValueOnce({ data: [], total, page: 1, limit: 20 });
    await expect(adminUserService.list()).resolves.toMatchObject({ totalPages });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/users");
  });

  it("bỏ tham số rỗng, chỉ gửi is_active=false khi lọc tài khoản bị khoá", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 });
    await adminUserService.list({ search: undefined, role: undefined, is_active: "false", page: 1, limit: 20 });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/users?is_active=false&page=1&limit=20");
  });
});

describe("adminUserService.get", () => {
  it("giữ hồ sơ mua sắm; interests null → []", async () => {
    mockFetch.mockResolvedValueOnce({
      ...rawUser,
      profile: { user_segment: "Sinh viên", occupation: null, age_range: "18-22", interests: null },
    });
    await expect(adminUserService.get(ID)).resolves.toEqual({
      ...rawUser,
      profile: { user_segment: "Sinh viên", occupation: null, age_range: "18-22", interests: [] },
    });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/users/${ID}`);
  });

  it("chưa có hồ sơ → profile null; id được encode", async () => {
    mockFetch.mockResolvedValueOnce({ ...rawUser, profile: null });
    const detail = await adminUserService.get("a/b");
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/users/a%2Fb");
    expect(detail.profile).toBeNull();
  });

  it("404 NT-IDN-1003 được ném tiếp cho page xử lý", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy người dùng", "NT-IDN-1003"));
    await expect(adminUserService.get(ID)).rejects.toMatchObject({ status: 404 });
  });
});
