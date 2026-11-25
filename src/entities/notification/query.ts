import { NOTIFICATION_MAX_PAGE_SIZE, NOTIFICATION_PAGE_SIZE } from "./types";

function positiveInt(raw: string | string[] | null | undefined, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : fallback;
}

/** `?page=` (trang sai → 1). Dùng chung cho trang và Route Handler. */
export const parsePage = (raw: string | string[] | null | undefined) => positiveInt(raw, 1);

/** `?limit=` (sai → mặc định, tối đa 50). */
export const parsePageSize = (raw: string | string[] | null | undefined) =>
  positiveInt(raw, NOTIFICATION_PAGE_SIZE, NOTIFICATION_MAX_PAGE_SIZE);
