/** Chuỗi query (`?page=`, `?limit=`…) → số nguyên dương; sai/thiếu → `fallback`, vượt `max` → `max`. */
export function positiveInt(raw: string | string[] | null | undefined, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : fallback;
}

/**
 * Dãy số trang để hiển thị: luôn có trang đầu, trang cuối và trang hiện tại ± `around`; khoảng trống thành "gap".
 * Ví dụ page=7, total=20 → [1, "gap", 6, 7, 8, "gap", 20].
 */
export function pageWindow(page: number, totalPages: number, around = 1): Array<number | "gap"> {
  if (totalPages <= 1) return [1];
  const current = Math.min(Math.max(page, 1), totalPages);
  const shown = new Set<number>([1, totalPages]);
  for (let p = current - around; p <= current + around; p++) if (p >= 1 && p <= totalPages) shown.add(p);
  const sorted = [...shown].sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) result.push(prev + 1); // thiếu đúng 1 trang thì hiện luôn, khỏi "…"
    else if (prev !== undefined && p - prev > 2) result.push("gap");
    result.push(p);
  });
  return result;
}
