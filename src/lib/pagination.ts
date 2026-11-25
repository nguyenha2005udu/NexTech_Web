/** Chuỗi query (`?page=`, `?limit=`…) → số nguyên dương; sai/thiếu → `fallback`, vượt `max` → `max`. */
export function positiveInt(raw: string | string[] | null | undefined, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : fallback;
}
