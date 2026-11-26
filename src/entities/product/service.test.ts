jest.mock("server-only", () => ({}));
jest.mock("@/lib/api/http", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return { ApiError, apiFetchPublic: jest.fn() };
});

import { ApiError, apiFetchPublic } from "@/lib/api/http";
import { productService } from "./service";
import type { ProductFilters } from "./types";

const fetchMock = apiFetchPublic as jest.Mock;
const baseFilters: ProductFilters = { brands: [], rams: [], cpus: [], sort: "relevance" };

const rawItem = (over: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "Tai nghe",
  brand: "NexTech",
  price: "120000",
  rating: null,
  primary_image: "https://res.cloudinary.com/demo/a.jpg",
  category_name: "Tai nghe",
  tags: [],
  ...over,
});

afterEach(() => jest.resetAllMocks());

describe("productService", () => {
  it("map danh sách: giá về số, id làm slug, rating null thành 0", async () => {
    fetchMock.mockResolvedValue({ items: [rawItem()], total: 1, page: 1 });
    const [p] = await productService.listPopular();
    expect(p).toMatchObject({ id: "p1", slug: "p1", price: 120000, rating: 0, brand: "NexTech" });
    expect(p?.images).toEqual([{ src: "https://res.cloudinary.com/demo/a.jpg", alt: "Tai nghe" }]);
  });

  it("sản phẩm không có ảnh thì images rỗng", async () => {
    fetchMock.mockResolvedValue({ items: [rawItem({ primary_image: null })], total: 1, page: 1 });
    expect((await productService.listPopular())[0]?.images).toEqual([]);
  });

  it("search gửi tham số tìm kiếm, giá, sắp xếp lên backend", async () => {
    fetchMock.mockResolvedValue({ items: [], total: 0, page: 1 });
    await productService.search({ ...baseFilters, q: "tai", min: 100, max: 900, sort: "price-asc", brands: ["NexTech"] });
    const path = String(fetchMock.mock.calls[0]?.[0]);
    expect(path).toContain("search=tai");
    expect(path).toContain("minPrice=100");
    expect(path).toContain("maxPrice=900");
    expect(path).toContain("sort=price_asc");
    expect(path).toContain("brand=NexTech");
  });

  it("search lọc RAM phía web vì backend chưa hỗ trợ", async () => {
    fetchMock.mockResolvedValue({ items: [rawItem()], total: 1, page: 1 });
    const { items } = await productService.search({ ...baseFilters, rams: ["16 GB"] });
    expect(items).toEqual([]);
  });

  it("getBySlug map chi tiết: thông số, còn hàng, ảnh chính lên đầu", async () => {
    fetchMock.mockResolvedValue({
      id: "p1",
      name: "Laptop",
      category_id: "c1",
      brand: "ASUS",
      price: "100",
      rating: "4.5",
      description: null,
      stock_quantity: 3,
      is_active: true,
      review_count: 2,
      specs: [{ spec_key: "RAM", spec_value: "16", spec_unit: "GB" }],
      tags: [{ name: "Gaming" }],
      images: [
        { image_url: "b", is_primary: false, sort_order: 0 },
        { image_url: "a", is_primary: true, sort_order: 1 },
      ],
    });
    const p = await productService.getBySlug("p1");
    expect(p).toMatchObject({ categorySlug: "c1", ram: "16 GB", inStock: true, tag: "Gaming", reviewCount: 2, rating: 4.5 });
    expect(p?.images.map((i) => i.src)).toEqual(["a", "b"]);
  });

  it("getBySlug trả null khi 404, ném lại lỗi khác", async () => {
    fetchMock.mockRejectedValueOnce(new ApiError(404, "x"));
    expect(await productService.getBySlug("zz")).toBeNull();
    fetchMock.mockRejectedValueOnce(new ApiError(503, "x"));
    await expect(productService.getBySlug("zz")).rejects.toThrow();
  });

  it("listByCategory trả rỗng khi id không hợp lệ (400)", async () => {
    fetchMock.mockRejectedValue(new ApiError(400, "x"));
    expect(await productService.listByCategory("laptop")).toEqual([]);
  });

  it("getManyByIds gọi không cache, bỏ id trùng và id không tồn tại", async () => {
    fetchMock.mockImplementation(async (path: string) => {
      if (path.endsWith("/p1")) return { id: "p1", name: "A", category_id: null, brand: null, price: "5", rating: null, description: null, stock_quantity: 1, is_active: true };
      throw new ApiError(404, "x");
    });
    const result = await productService.getManyByIds(["p1", "p1", "zz"]);
    expect(result.map((p) => p.id)).toEqual(["p1"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every((c) => c[1] === 0)).toBe(true);
  });

  it("getManyByIds với danh sách rỗng trả mảng rỗng", async () => {
    expect(await productService.getManyByIds([])).toEqual([]);
  });
});
