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

  describe("search — phân trang", () => {
    /** Backend giả: `total` sản phẩm, tuân theo ?page= và ?limit= (tối đa 100/trang như thật). */
    function fakeBackend(total: number, brandOf: (i: number) => string = () => "NexTech") {
      fetchMock.mockImplementation(async (path: string) => {
        const q = new URL(path, "http://x").searchParams;
        const page = Number(q.get("page") ?? 1);
        const limit = Math.min(Number(q.get("limit") ?? 20), 100);
        const start = (page - 1) * limit;
        const items = Array.from({ length: Math.max(0, Math.min(limit, total - start)) }, (_, k) =>
          rawItem({ id: `p${start + k + 1}`, brand: brandOf(start + k) }),
        );
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
      });
    }

    it("không cần lọc phía web: nhờ backend cắt trang (page, limit=24) và lấy total của backend", async () => {
      fakeBackend(161);
      const result = await productService.search(baseFilters, 3);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const q = new URL(String(fetchMock.mock.calls[0]?.[0]), "http://x").searchParams;
      expect(q.get("page")).toBe("3");
      expect(q.get("limit")).toBe("24");
      expect(result).toMatchObject({ total: 161, page: 3, totalPages: 7 });
      expect(result.items).toHaveLength(24);
      expect(result.items[0]?.id).toBe("p49");
    });

    it("trang cuối chỉ có phần dư", async () => {
      fakeBackend(161);
      const result = await productService.search(baseFilters, 7);
      expect(result.items).toHaveLength(161 - 6 * 24);
      expect(result.totalPages).toBe(7);
    });

    it("trang vượt quá số trang: items rỗng nhưng vẫn báo đúng total và totalPages để trang tự về trang cuối", async () => {
      fakeBackend(161);
      const result = await productService.search(baseFilters, 99);
      expect(result).toMatchObject({ items: [], total: 161, totalPages: 7 });
    });

    it("không có kết quả vẫn có 1 trang", async () => {
      fakeBackend(0);
      expect(await productService.search(baseFilters)).toMatchObject({ items: [], total: 0, totalPages: 1 });
    });

    it("một hãng + khoảng giá vẫn do backend lọc và phân trang (không lấy hết)", async () => {
      fakeBackend(50);
      await productService.search({ ...baseFilters, brands: ["NexTech"], min: 100 }, 2);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const q = new URL(String(fetchMock.mock.calls[0]?.[0]), "http://x").searchParams;
      expect(q.get("brand")).toBe("NexTech");
      expect(q.get("minPrice")).toBe("100");
    });

    it("nhiều hãng: lấy HẾT các trang của backend, lọc ở web, total là số SAU lọc rồi mới cắt trang", async () => {
      // 161 sản phẩm, hãng xoay vòng A, B, C → mỗi hãng ~54 sản phẩm
      fakeBackend(161, (i) => ["A", "B", "C"][i % 3]!);
      const result = await productService.search({ ...baseFilters, brands: ["A", "B"] }, 1);
      expect(fetchMock).toHaveBeenCalledTimes(2); // 2 trang × 100 của backend
      const expectedTotal = 54 + 54; // A: i%3==0 → 54, B: i%3==1 → 54 (i từ 0..160)
      expect(result.total).toBe(expectedTotal);
      expect(result.totalPages).toBe(Math.ceil(expectedTotal / 24));
      expect(result.items).toHaveLength(24);
      expect(result.items.every((p) => ["A", "B"].includes(p.brand))).toBe(true);
    });

    it("nhiều hãng: trang 2 là phần kế tiếp của danh sách đã lọc, không trùng trang 1", async () => {
      fakeBackend(161, (i) => ["A", "B", "C"][i % 3]!);
      const page1 = await productService.search({ ...baseFilters, brands: ["A", "B"] }, 1);
      const page2 = await productService.search({ ...baseFilters, brands: ["A", "B"] }, 2);
      const ids1 = new Set(page1.items.map((p) => p.id));
      expect(page2.items.some((p) => ids1.has(p.id))).toBe(false);
      expect(page2.page).toBe(2);
    });

    it("lọc RAM/CPU (backend chưa hỗ trợ): total là số sau lọc, không phải tổng 161 của backend", async () => {
      fakeBackend(161);
      const result = await productService.search({ ...baseFilters, rams: ["16 GB"] });
      expect(result).toMatchObject({ items: [], total: 0, totalPages: 1 });
    });

    it("lấy hết tối đa 20 trang, không lặp vô hạn khi backend báo total khổng lồ", async () => {
      fetchMock.mockImplementation(async (path: string) => {
        const page = Number(new URL(path, "http://x").searchParams.get("page") ?? 1);
        return { items: [rawItem({ id: `p${page}` })], total: 999_999, page, limit: 100, totalPages: 9_999 };
      });
      await productService.search({ ...baseFilters, brands: ["A", "B"] });
      expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(20);
    });
  });

  describe("listAll", () => {
    it("lấy mọi trang (không cụt ở 100 sản phẩm đầu) để dựng bộ lọc hãng", async () => {
      fetchMock.mockImplementation(async (path: string) => {
        const page = Number(new URL(path, "http://x").searchParams.get("page") ?? 1);
        const items = page === 1 ? Array.from({ length: 100 }, (_, i) => rawItem({ id: `a${i}` })) : [rawItem({ id: "z1", brand: "Nubia" })];
        return { items, total: 101, page, limit: 100, totalPages: 2 };
      });
      const all = await productService.listAll();
      expect(all).toHaveLength(101);
      expect(all.at(-1)?.brand).toBe("Nubia");
    });
  });
});
