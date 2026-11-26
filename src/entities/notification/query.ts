import { positiveInt } from "@/lib/pagination";
import { NOTIFICATION_MAX_PAGE_SIZE, NOTIFICATION_PAGE_SIZE } from "./types";

/** `?page=` (trang sai → 1). Dùng chung cho trang và Route Handler. */
export const parsePage = (raw: string | string[] | null | undefined) => positiveInt(raw, 1);

/** `?limit=` (sai → mặc định, tối đa 50). */
export const parsePageSize = (raw: string | string[] | null | undefined) =>
  positiveInt(raw, NOTIFICATION_PAGE_SIZE, NOTIFICATION_MAX_PAGE_SIZE);
