/** @jest-environment node */
import { productService } from "./service";

describe("productService.getManyByIds", () => {
  it("trả sản phẩm theo id, bỏ qua id không tồn tại", async () => {
    const products = await productService.getManyByIds(["p-asus-vivobook-15", "khong-co"]);
    expect(products.map((p) => p.id)).toEqual(["p-asus-vivobook-15"]);
  });
});

describe("productService — đọc dữ liệu", () => {
  it("getBySlug trả đúng sản phẩm, slug lạ trả null", async () => {
    expect((await productService.getBySlug("asus-vivobook-15"))?.id).toBe("p-asus-vivobook-15");
    expect(await productService.getBySlug("khong-co")).toBeNull();
  });

  it("listPopular có đủ sản phẩm với slug duy nhất", async () => {
    const products = await productService.listPopular();
    expect(products.length).toBeGreaterThan(0);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });

  it("listFeatured là tập con của listPopular, không có phần tử rỗng", async () => {
    const popularIds = (await productService.listPopular()).map((p) => p.id);
    const featured = await productService.listFeatured();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((p) => popularIds.includes(p.id))).toBe(true);
  });

  it("listByCategory chỉ trả sản phẩm của danh mục đó", async () => {
    const laptops = await productService.listByCategory("laptop");
    expect(laptops.length).toBeGreaterThan(0);
    expect(laptops.every((p) => p.categorySlug === "laptop")).toBe(true);
    expect(await productService.listByCategory("khong-co")).toEqual([]);
  });

  it("search áp dụng bộ lọc nhưng total là tổng toàn bộ sản phẩm", async () => {
    const all = await productService.listPopular();
    const { items, total } = await productService.search({ brands: ["ASUS"], rams: [], cpus: [], sort: "relevance" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.brand === "ASUS")).toBe(true);
    expect(total).toBe(all.length);
  });

  it("getManyByIds với danh sách rỗng trả mảng rỗng", async () => {
    expect(await productService.getManyByIds([])).toEqual([]);
  });
});
