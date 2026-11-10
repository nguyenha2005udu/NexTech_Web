import "server-only";
import { mockCategories, navCategorySlugs } from "./mock-data";
import type { Category } from "./types";

// TODO(backend): thay mock bằng lib/api/http.ts khi chốt hợp đồng API.
export const categoryService = {
  async list(): Promise<Category[]> {
    return mockCategories;
  },

  async listNav(): Promise<Category[]> {
    return navCategorySlugs
      .map((slug) => mockCategories.find((c) => c.slug === slug))
      .filter((c): c is Category => c !== undefined);
  },

  async getBySlug(slug: string): Promise<Category | null> {
    return mockCategories.find((c) => c.slug === slug) ?? null;
  },
};
