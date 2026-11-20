/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { ApiError, apiFetch, apiFetchForm } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import {
  addProductImage,
  addProductSpec,
  addProductTag,
  deleteProduct,
  removeProductImage,
  removeProductSpec,
  removeProductTag,
  saveProduct,
  setPrimaryImage,
  updateProductSpec,
} from "./actions";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/lib/api/http", () => {
  const actual: typeof import("@/lib/api/http") = jest.requireActual("@/lib/api/http");
  return { ...actual, apiFetch: jest.fn(), apiFetchForm: jest.fn() };
});

const mockSession = jest.mocked(getSessionUser);
const mockFetch = jest.mocked(apiFetch);
const mockFetchForm = jest.mocked(apiFetchForm);
const P = "bbbbbbbb-0000-4000-8000-000000000101";
const X = "bbbbbbbb-0000-4000-8000-000000001001";
const CAT = "bbbbbbbb-0000-4000-8000-000000000011";
const form = { name: "Laptop X", categoryId: CAT, brand: "", price: 1000, description: "", stockQuantity: 2, isActive: true };

const user = (role: SessionUser["role"]): SessionUser => ({ id: "u", email: "a@x.vn", full_name: "A", role, avatar_url: null });

beforeEach(() => mockSession.mockResolvedValue(user("admin")));

describe("saveProduct", () => {
  it("người dùng thường bị chuyển sang /403, không gọi API", async () => {
    mockSession.mockResolvedValue(user("user"));
    await expect(saveProduct(null, form)).rejects.toThrow("REDIRECT:/403");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("thêm mới: POST body snake_case, trả id, revalidate admin + trang SP", async () => {
    mockFetch.mockResolvedValueOnce({ id: P });
    await expect(saveProduct(null, form)).resolves.toEqual({ ok: true, data: { id: P } });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/products", {
      method: "POST",
      body: { name: "Laptop X", category_id: CAT, brand: undefined, price: 1000, description: undefined, stock_quantity: 2, is_active: true },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(revalidatePath).toHaveBeenCalledWith("/products/[slug]", "page");
  });

  it("thêm mới thiếu danh mục → lỗi theo ô", async () => {
    const result = await saveProduct(null, { ...form, categoryId: undefined });
    expect(result).toMatchObject({ ok: false, fieldErrors: { categoryId: "Vui lòng chọn danh mục" } });
  });

  it("sửa một phần: PUT chỉ trường đã gửi", async () => {
    mockFetch.mockResolvedValueOnce({});
    await expect(saveProduct(P, { isActive: true })).resolves.toEqual({ ok: true, data: { id: P } });
    const [path, init] = mockFetch.mock.calls[0] ?? [];
    expect(path).toBe(`/api/admin/products/${P}`);
    expect(JSON.parse(JSON.stringify(init))).toEqual({ method: "PUT", body: { is_active: true } });
  });

  it("id sai định dạng bị từ chối", async () => {
    await expect(saveProduct("../x", form)).resolves.toEqual({ ok: false, message: "Mã không hợp lệ" });
  });

  it("sản phẩm không tồn tại → trả thông báo backend", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy sản phẩm", "NT-CAT-1005"));
    await expect(saveProduct(P, { price: 5 })).resolves.toEqual({ ok: false, message: "Không tìm thấy sản phẩm" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteProduct", () => {
  it("DELETE theo id", async () => {
    mockFetch.mockResolvedValueOnce({ message: "ok" });
    await expect(deleteProduct(P)).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/products/${P}`, { method: "DELETE" });
  });

  it("khách chưa đăng nhập bị chuyển sang đăng nhập", async () => {
    mockSession.mockResolvedValue(null);
    await expect(deleteProduct(P)).rejects.toThrow("REDIRECT:/login");
  });
});

describe("ảnh", () => {
  const fd = (entries: Record<string, string | Blob>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.append(k, v);
    return f;
  };

  it("tải file: gửi multipart field file + is_primary", async () => {
    mockFetchForm.mockResolvedValueOnce({ id: X, image_url: "u", is_primary: true, sort_order: 0 });
    const file = new File(["png"], "a.png", { type: "image/png" });
    const result = await addProductImage(fd({ productId: P, file, isPrimary: "true" }));
    expect(result.ok).toBe(true);
    const [path, body] = mockFetchForm.mock.calls[0] ?? [];
    expect(path).toBe(`/api/admin/products/${P}/images`);
    expect((body?.get("file") as File).name).toBe("a.png");
    expect(body?.get("is_primary")).toBe("true");
  });

  it("file sai loại bị chặn trước khi gửi", async () => {
    const file = new File(["%PDF"], "a.pdf", { type: "application/pdf" });
    const result = await addProductImage(fd({ productId: P, file }));
    expect(result).toMatchObject({ ok: false, message: "Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF" });
    expect(mockFetchForm).not.toHaveBeenCalled();
  });

  it("dán URL: gửi image_url; URL sai → lỗi ô imageUrl", async () => {
    mockFetchForm.mockResolvedValueOnce({ id: X, image_url: "https://a.vn/x.jpg", is_primary: false, sort_order: 0 });
    await addProductImage(fd({ productId: P, imageUrl: " https://a.vn/x.jpg " }));
    expect(mockFetchForm.mock.calls[0]?.[1].get("image_url")).toBe("https://a.vn/x.jpg");

    const bad = await addProductImage(fd({ productId: P, imageUrl: "javascript:alert(1)" }));
    expect(bad).toMatchObject({ ok: false, fieldErrors: { imageUrl: expect.any(String) } });
  });

  it("đặt ảnh chính: PUT is_primary; xoá ảnh: DELETE", async () => {
    mockFetch.mockResolvedValue({});
    await setPrimaryImage(P, X);
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/products/${P}/images/${X}`, { method: "PUT", body: { is_primary: true } });
    await removeProductImage(P, X);
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/products/${P}/images/${X}`, { method: "DELETE" });
  });

  it("id ảnh sai bị từ chối", async () => {
    await expect(removeProductImage(P, "1")).resolves.toEqual({ ok: false, message: "Mã không hợp lệ" });
  });
});

describe("thông số", () => {
  it("thêm: body snake_case, đơn vị rỗng → null", async () => {
    mockFetch.mockResolvedValueOnce({ id: X, spec_key: "RAM", spec_value: "16", spec_unit: null });
    await addProductSpec(P, { key: " RAM ", value: "16", unit: "" });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/products/${P}/specs`, {
      method: "POST",
      body: { spec_key: "RAM", spec_value: "16", spec_unit: null },
    });
  });

  it("sửa: PUT; input sai → lỗi theo ô", async () => {
    mockFetch.mockResolvedValueOnce({});
    await updateProductSpec(P, X, { key: "RAM", value: "32", unit: "GB" });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/products/${P}/specs/${X}`, expect.objectContaining({ method: "PUT" }));
    await expect(updateProductSpec(P, X, { key: "", value: "1" })).resolves.toMatchObject({
      ok: false,
      fieldErrors: { key: "Nhập tên thông số" },
    });
  });

  it("xoá: DELETE", async () => {
    mockFetch.mockResolvedValueOnce({});
    await expect(removeProductSpec(P, X)).resolves.toEqual({ ok: true });
  });
});

describe("tag", () => {
  it("thêm: trả { id, name } từ { id, tag } của backend", async () => {
    mockFetch.mockResolvedValueOnce({ id: X, tag: "Gaming" });
    await expect(addProductTag(P, " Gaming ")).resolves.toEqual({ ok: true, data: { id: X, name: "Gaming" } });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/products/${P}/tags`, { method: "POST", body: { tag: "Gaming" } });
  });

  it("tag rỗng bị từ chối; gỡ tag: DELETE", async () => {
    await expect(addProductTag(P, "  ")).resolves.toMatchObject({ ok: false });
    mockFetch.mockResolvedValueOnce({});
    await expect(removeProductTag(P, X)).resolves.toEqual({ ok: true });
  });
});
