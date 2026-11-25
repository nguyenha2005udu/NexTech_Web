import { z } from "zod";

export const createPriceAlertSchema = z.object({
  productId: z.string().min(1).max(64),
  targetPrice: z
    .number({ message: "Nhập giá mục tiêu" })
    .int("Giá phải là số nguyên")
    .positive("Giá phải lớn hơn 0")
    .max(1_000_000_000, "Giá quá lớn"),
});

export const removePriceAlertSchema = z.object({ alertId: z.string().min(1).max(64) });
