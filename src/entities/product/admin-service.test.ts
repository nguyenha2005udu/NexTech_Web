/** @jest-environment node */
import { ApiError, apiFetch } from "@/lib/api/http";
import { adminProductService } from "./admin-service";
import type { AdminProductListItem } from "./admin-types";

jest.mock("@/lib/api/http", () => {
  const actual: typeof import("@/lib/api/http") = jest.requireActual("@/lib/api/http");
  return { ...actual, apiFetch: jest.fn() };
});

const mockFetch = jest.mocked(apiFetch);
const ID = "bbbbbbbb-0000-4000-8000-000000000104";
const rawRow = {
  id: ID,
  name: "Tai nghe cũ",
  category: "Tai nghe",
  brand: "NexTech",
  price: "150000",
  rating: null,
  stock_quantity: 0,
  is_active: false,
  created_at: "2026-11-15T14:10:56.793Z",
  thumbnail: null,
};

describe("adminProductService.list", () => {
  it("đổi price chuỗi decimal sang number và chỉ gửi tham số có giá trị", async () => {
    mockFetch.mockResolvedValueOnce({ items: [rawRow], total: 1, page: 1, limit: 20, totalPages: 1 });
    const page = await adminProductService.list({ search: "", sort: "price_desc", page: 1, limit: 20 });
    expect(page.items[0]?.price).toBe(150_000);
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/products?sort=price_desc&page=1&limit=20");
  });
});

describe("adminProductService.getForEdit", () => {
  it("SP đang bán: lấy từ API công khai, ảnh chính lên đầu, chỉ giữ trường cần", async () => {
    mockFetch.mockResolvedValueOnce({
      id: ID,
      name: "Tai nghe",
      category_id: "c1",
      category: { id: "c1" },
      brand: "NexTech",
      price: "200000",
      description: null,
      stock_quantity: 5,
      is_active: true,
      images: [
        { id: "i2", product_id: ID, image_url: "b", public_id: null, is_primary: false, sort_order: 0 },
        { id: "i1", product_id: ID, image_url: "a", public_id: null, is_primary: true, sort_order: 1 },
      ],
      specs: [{ id: "s1", product_id: ID, spec_key: "RAM", spec_value: "16", spec_unit: "GB" }],
      tags: [{ id: "t1", name: "Gaming" }],
    });
    const data = await adminProductService.getForEdit(ID);
    expect(mockFetch).toHaveBeenCalledWith(`/api/products/${ID}`);
    expect(data?.partial).toBe(false);
    if (data && !data.partial) {
      expect(data.product.price).toBe(200_000);
      expect(data.product.images.map((i) => i.id)).toEqual(["i1", "i2"]);
      expect(data.product.images[0]).toEqual({ id: "i1", image_url: "a", is_primary: true, sort_order: 1 });
      expect(data.product.specs[0]).toEqual({ id: "s1", spec_key: "RAM", spec_value: "16", spec_unit: "GB" });
      expect(data.product.tags).toEqual([{ id: "t1", name: "Gaming" }]);
    }
  });

  it("SP ngừng bán (API công khai 404) có trong trang đang xem → dữ liệu dòng + partial", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy sản phẩm", "NT-CAT-1005"));
    const row: AdminProductListItem = { ...rawRow, price: 150_000 };
    await expect(adminProductService.getForEdit(ID, [row])).resolves.toEqual({ partial: true, product: row });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("không có trong trang đang xem → tìm trong danh sách SP ngừng bán", async () => {
    mockFetch
      .mockRejectedValueOnce(new ApiError(404, "Không tìm thấy sản phẩm"))
      .mockResolvedValueOnce({ items: [rawRow], total: 1, page: 1, limit: 100, totalPages: 1 });
    const data = await adminProductService.getForEdit(ID, []);
    expect(mockFetch).toHaveBeenLastCalledWith("/api/admin/products?isActive=false&limit=100");
    expect(data).toMatchObject({ partial: true, product: { id: ID, price: 150_000 } });
  });

  it("không tìm thấy ở đâu → null; lỗi khác 404 thì ném tiếp", async () => {
    mockFetch
      .mockRejectedValueOnce(new ApiError(404, "x"))
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 100, totalPages: 0 });
    await expect(adminProductService.getForEdit(ID, [])).resolves.toBeNull();

    mockFetch.mockRejectedValueOnce(new ApiError(503, "Không kết nối được máy chủ"));
    await expect(adminProductService.getForEdit(ID)).rejects.toThrow("Không kết nối được máy chủ");
  });
});
