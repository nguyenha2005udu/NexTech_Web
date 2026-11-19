// Tiện ích dùng chung cho test (mục 12.3): factory dữ liệu mẫu. Chỉ import trong *.test.ts(x).
import type { Product, ProductFilters } from "@/entities/product";

let seq = 0;

/** Sản phẩm mẫu hợp lệ; ghi đè trường cần thiết cho từng test. */
export function makeProduct(override: Partial<Product> = {}): Product {
  seq += 1;
  return {
    id: `p-${seq}`,
    slug: `san-pham-${seq}`,
    name: `Sản phẩm ${seq}`,
    brand: "ASUS",
    categorySlug: "laptop",
    tag: "Học tập",
    summary: "Core i5 · 16 GB RAM · SSD 512 GB",
    headline: "Core i5 · 16 GB RAM · SSD 512 GB",
    price: 15_000_000,
    rating: 4.5,
    reviewCount: 10,
    inStock: true,
    ram: "16 GB",
    cpu: "Intel Core i5",
    specs: [],
    images: [],
    ...override,
  };
}

/** Bộ lọc rỗng (mặc định khi URL không có tham số). */
export function makeFilters(override: Partial<ProductFilters> = {}): ProductFilters {
  return { brands: [], rams: [], cpus: [], sort: "relevance", ...override };
}
