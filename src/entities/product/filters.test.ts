import { makeFilters, makeProduct } from "@/lib/test-utils";
import {
  SEARCH_PAGE_SIZE,
  applyProductFilters,
  getFilterFacets,
  hasActiveFilters,
  parseProductFilters,
  searchHref,
  serializeProductFilters,
} from "./filters";

describe("parseProductFilters", () => {
  it("trả bộ lọc mặc định khi URL không có tham số", () => {
    expect(parseProductFilters({})).toEqual(makeFilters());
  });

  it("cắt khoảng trắng của từ khoá và bỏ từ khoá rỗng", () => {
    expect(parseProductFilters({ q: "  laptop  " }).q).toBe("laptop");
    expect(parseProductFilters({ q: "   " }).q).toBeUndefined();
  });

  it("tách danh sách phân cách bằng dấu phẩy và gộp tham số lặp", () => {
    const filters = parseProductFilters({ brand: ["ASUS,Dell", "HP"], ram: "16 GB" });
    expect(filters.brands).toEqual(["ASUS", "Dell", "HP"]);
    expect(filters.rams).toEqual(["16 GB"]);
  });

  it("bỏ qua giá không hợp lệ hoặc âm", () => {
    expect(parseProductFilters({ min: "abc", max: "-5" })).toMatchObject({ min: undefined, max: undefined });
    expect(parseProductFilters({ min: "10000000", max: ["20000000", "1"] })).toMatchObject({
      min: 10_000_000,
      max: 20_000_000,
    });
  });

  it("về 'relevance' khi cách sắp xếp không hợp lệ", () => {
    expect(parseProductFilters({ sort: "price-desc" }).sort).toBe("price-desc");
    expect(parseProductFilters({ sort: "gia-re" }).sort).toBe("relevance");
  });
});

describe("serializeProductFilters", () => {
  it("không ghi tham số mặc định lên URL", () => {
    expect(serializeProductFilters(makeFilters()).toString()).toBe("");
  });

  it("đọc lại được đúng bộ lọc đã ghi (khứ hồi URL)", () => {
    const filters = makeFilters({
      q: "laptop 16 GB",
      brands: ["ASUS", "Dell"],
      rams: ["16 GB"],
      cpus: ["Intel Core i5"],
      min: 0,
      max: 20_000_000,
      sort: "price-asc",
    });
    const raw = Object.fromEntries(serializeProductFilters(filters));
    expect(parseProductFilters(raw)).toEqual(filters);
  });
});

describe("applyProductFilters", () => {
  const asus = makeProduct({ name: "ASUS Vivobook 15", brand: "ASUS", price: 14_990_000, rating: 4.7, tag: "Học tập" });
  const dell = makeProduct({ name: "Dell Inspiron 14", brand: "Dell", price: 16_990_000, rating: 4.2, tag: "Văn phòng" });
  const monitor = makeProduct({
    name: "LG UltraGear 24",
    brand: "LG",
    categorySlug: "man-hinh",
    price: 3_590_000,
    rating: 4.9,
    tag: "Gaming",
    ram: undefined,
    cpu: undefined,
  });
  const all = [asus, dell, monitor];

  it("giữ nguyên danh sách khi không có điều kiện lọc", () => {
    expect(applyProductFilters(all, makeFilters())).toEqual(all);
  });

  it("tìm từ khoá không phân biệt dấu và hoa thường", () => {
    expect(applyProductFilters(all, makeFilters({ q: "hoc tap" }))).toEqual([asus]);
    expect(applyProductFilters(all, makeFilters({ q: "VĂN PHÒNG" }))).toEqual([dell]);
  });

  it("yêu cầu khớp tất cả các từ trong từ khoá", () => {
    expect(applyProductFilters(all, makeFilters({ q: "asus vivobook" }))).toEqual([asus]);
    expect(applyProductFilters(all, makeFilters({ q: "asus inspiron" }))).toEqual([]);
  });

  it("lọc theo thương hiệu và khoảng giá", () => {
    expect(applyProductFilters(all, makeFilters({ brands: ["ASUS", "LG"] }))).toEqual([asus, monitor]);
    expect(applyProductFilters(all, makeFilters({ min: 10_000_000, max: 15_000_000 }))).toEqual([asus]);
  });

  it("loại sản phẩm không có thông số khi lọc theo RAM/CPU", () => {
    expect(applyProductFilters(all, makeFilters({ rams: ["16 GB"] }))).toEqual([asus, dell]);
    expect(applyProductFilters(all, makeFilters({ cpus: ["Intel Core i5"] }))).not.toContain(monitor);
  });

  it("sắp xếp theo giá tăng, giá giảm và đánh giá", () => {
    const names = (sort: "price-asc" | "price-desc" | "rating") =>
      applyProductFilters(all, makeFilters({ sort })).map((p) => p.brand);
    expect(names("price-asc")).toEqual(["LG", "ASUS", "Dell"]);
    expect(names("price-desc")).toEqual(["Dell", "ASUS", "LG"]);
    expect(names("rating")).toEqual(["LG", "ASUS", "Dell"]);
  });

  it("không làm thay đổi mảng đầu vào khi sắp xếp", () => {
    const input = [...all];
    applyProductFilters(input, makeFilters({ sort: "price-asc" }));
    expect(input).toEqual(all);
  });
});

describe("getFilterFacets", () => {
  it("lấy giá trị duy nhất, bỏ trường trống, RAM được sắp xếp", () => {
    const facets = getFilterFacets([
      makeProduct({ brand: "Dell", ram: "32 GB", cpu: "AMD Ryzen 5" }),
      makeProduct({ brand: "ASUS", ram: "16 GB", cpu: "AMD Ryzen 5" }),
      makeProduct({ brand: "Dell", ram: undefined, cpu: undefined }),
    ]);
    expect(facets).toEqual({ brands: ["Dell", "ASUS"], rams: ["16 GB", "32 GB"], cpus: ["AMD Ryzen 5"] });
  });
});

describe("hasActiveFilters", () => {
  it("không tính từ khoá và cách sắp xếp là bộ lọc", () => {
    expect(hasActiveFilters(makeFilters({ q: "laptop", sort: "rating" }))).toBe(false);
  });

  it.each([
    ["thương hiệu", { brands: ["ASUS"] }],
    ["RAM", { rams: ["16 GB"] }],
    ["CPU", { cpus: ["Intel Core i5"] }],
    ["giá tối thiểu 0", { min: 0 }],
    ["giá tối đa", { max: 1 }],
  ])("bật khi có điều kiện %s", (_label, override) => {
    expect(hasActiveFilters(makeFilters(override))).toBe(true);
  });
});

describe("searchHref", () => {
  it("trang 1 bỏ ?page= để trùng link gốc", () => {
    expect(searchHref("/search", makeFilters({ q: "laptop" }), 1)).toBe("/search?q=laptop");
    expect(searchHref("/search", makeFilters(), 1)).toBe("/search");
  });

  it("trang > 1 thêm ?page= và giữ nguyên từ khoá, bộ lọc, sắp xếp", () => {
    const filters = makeFilters({ q: "laptop", brands: ["ASUS", "Dell"], min: 100, max: 900, sort: "price-asc" });
    const sp = new URL(searchHref("/search", filters, 3), "http://x").searchParams;
    expect(sp.get("q")).toBe("laptop");
    expect(sp.get("brand")).toBe("ASUS,Dell");
    expect(sp.get("min")).toBe("100");
    expect(sp.get("max")).toBe("900");
    expect(sp.get("sort")).toBe("price-asc");
    expect(sp.get("page")).toBe("3");
  });

  it("không có bộ lọc nào: chỉ ?page=", () => {
    expect(searchHref("/search", makeFilters(), 2)).toBe("/search?page=2");
  });

  it("kích thước trang chia hết cho 3 cột của lưới", () => {
    expect(SEARCH_PAGE_SIZE % 3).toBe(0);
  });
});
