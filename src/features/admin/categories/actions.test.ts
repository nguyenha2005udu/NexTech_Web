/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { hideCategory, saveCategory } from "./actions";

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
const ID = "bbbbbbbb-0000-4000-8000-000000000011";
const form = { name: " Laptop ", icon: "", sortOrder: 2, industryId: undefined, isActive: true };

const user = (role: SessionUser["role"]): SessionUser => ({
  id: "u-1",
  email: "a@nextech.local",
  full_name: "A",
  role,
  avatar_url: null,
});

beforeEach(() => mockSession.mockResolvedValue(user("admin")));

describe("saveCategory", () => {
  it("người dùng thường bị chuyển sang /403, không gọi API", async () => {
    mockSession.mockResolvedValue(user("user"));
    await expect(saveCategory(null, form)).rejects.toThrow("REDIRECT:/403");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("thêm mới: POST body đã chuẩn hoá (trim, icon/ngành học rỗng → null) rồi revalidate", async () => {
    mockFetch.mockResolvedValueOnce({});
    await expect(saveCategory(null, form)).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/categories", {
      method: "POST",
      body: { name: "Laptop", icon: null, sortOrder: 2, industryId: null, isActive: true },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("sửa: PATCH theo id", async () => {
    mockFetch.mockResolvedValueOnce({});
    await saveCategory(ID, form);
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/categories/${ID}`, expect.objectContaining({ method: "PATCH" }));
  });

  it("input sai → lỗi theo ô, không gọi API", async () => {
    const result = await saveCategory(null, { ...form, name: "" });
    expect(result).toMatchObject({ ok: false, fieldErrors: { name: "Vui lòng nhập tên danh mục" } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("id sai định dạng bị từ chối", async () => {
    await expect(saveCategory("1 OR 1=1", form)).resolves.toEqual({ ok: false, message: "Mã danh mục không hợp lệ" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("lỗi backend (404 ngành học) → trả thông báo, không revalidate", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy ngành học"));
    await expect(saveCategory(null, form)).resolves.toEqual({ ok: false, message: "Không tìm thấy ngành học" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("hideCategory", () => {
  it("gọi DELETE (xoá mềm) rồi revalidate", async () => {
    mockFetch.mockResolvedValueOnce({ message: "Đã ẩn danh mục thành công" });
    await expect(hideCategory(ID)).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/categories/${ID}`, { method: "DELETE" });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it("khách chưa đăng nhập bị chuyển sang trang đăng nhập", async () => {
    mockSession.mockResolvedValue(null);
    await expect(hideCategory(ID)).rejects.toThrow("REDIRECT:/login");
  });

  it("id sai định dạng bị từ chối", async () => {
    await expect(hideCategory(42)).resolves.toEqual({ ok: false, message: "Mã danh mục không hợp lệ" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("danh mục không tồn tại → trả thông báo backend", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy danh mục"));
    await expect(hideCategory(ID)).resolves.toEqual({ ok: false, message: "Không tìm thấy danh mục" });
  });
});
