import { z } from "zod";

/** Không có `ids` = đánh dấu tất cả đã đọc. */
export const markReadSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(100).optional(),
});
