import "server-only";
import { applyProductFilters } from "./filters";
import { featuredSlugs, mockProducts } from "./mock-data";
import type { Product, ProductFilters } from "./types";

// TODO(backend): thay mock bằng lib/api/http.ts khi chốt hợp đồng API (giả định kỹ thuật #1).
export const productService = {
  async listFeatured(): Promise<Product[]> {
    return featuredSlugs
      .map((slug) => mockProducts.find((p) => p.slug === slug))
      .filter((p): p is Product => p !== undefined);
  },

  async listPopular(): Promise<Product[]> {
    return mockProducts;
  },

  async listByCategory(categorySlug: string): Promise<Product[]> {
    return mockProducts.filter((p) => p.categorySlug === categorySlug);
  },

  async search(filters: ProductFilters): Promise<{ items: Product[]; total: number }> {
    const items = applyProductFilters(mockProducts, filters);
    return { items, total: mockProducts.length };
  },

  async getBySlug(slug: string): Promise<Product | null> {
    return mockProducts.find((p) => p.slug === slug) ?? null;
  },
};
