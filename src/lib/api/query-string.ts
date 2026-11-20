// Tạo query string cho API backend: bỏ tham số `undefined` / `null` / "" (backend coi thiếu = không lọc).
export type QueryValue = string | number | boolean | null | undefined;

/** `{ page: 1, search: "" }` → `"?page=1"`; không còn tham số nào → `""`. */
export function toQueryString(query: Readonly<Record<string, QueryValue>>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
