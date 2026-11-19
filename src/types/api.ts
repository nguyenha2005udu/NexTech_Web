// Mục 4.2 — Type dùng chung cho dữ liệu backend.
// Backend trả body thành công KHÔNG bọc { data } (ADR-0009) → apiFetch<T>() với T là chính dữ liệu.
// Body lỗi chuẩn: ApiErrorBody ở lib/api/http.ts.

/** Danh sách có phân trang — đúng body backend: `{ items, total, page, limit, totalPages }`. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface HasId {
  id: string;
}
