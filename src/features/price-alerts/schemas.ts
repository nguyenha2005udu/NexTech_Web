import { z } from "zod";

// FDD 6.1.1 — Giá mục tiêu phải > 0 và thấp hơn giá hiện tại.
export const targetPriceSchema = (currentPrice: number) =>
  z
    .number({ error: "Vui lòng nhập giá mục tiêu" })
    .int("Giá mục tiêu phải là số nguyên")
    .positive("Giá mục tiêu phải lớn hơn 0")
    .lt(currentPrice, "Giá mục tiêu cần thấp hơn giá hiện tại");

export const createPriceAlertSchema = z.object({
  productId: z.string().min(1),
  targetPrice: z.number().int().positive(),
});
export type CreatePriceAlertInput = z.infer<typeof createPriceAlertSchema>;
