import "server-only";
import { apiFetch } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import type { AdminCategory, AdminCategoryQuery, Industry } from "./types";

// FDD 7.1 — Danh mục phía quản trị (design/admin/02 §3). Gateway yêu cầu vai trò admin.
// Ghi (thêm / sửa / ẩn) nằm ở Server Action `features/admin/categories/actions.ts`.
export const adminCategoryService = {
  list: (query: AdminCategoryQuery = {}) =>
    apiFetch<Paginated<AdminCategory>>(`/api/admin/categories${toQueryString({ ...query })}`),

  get: (id: string) => apiFetch<AdminCategory>(`/api/admin/categories/${encodeURIComponent(id)}`),

  /** API trả `{ items, total }` (tài liệu 02 §3 ghi nhầm là mảng — đã gọi thử 2026-11-20). */
  async listIndustries(): Promise<Industry[]> {
    const { items } = await apiFetch<{ items: Industry[]; total: number }>("/api/industries");
    return items.map(({ id, name }) => ({ id, name }));
  },
};
