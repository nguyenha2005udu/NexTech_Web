// FDD 8.2.6 — zod cho Server Action xác nhận đã thu COD (design/admin/06 §2).
import { z } from "zod";

export const paymentIdSchema = z.uuid("Mã giao dịch không hợp lệ");

export const confirmCodSchema = z.object({ id: paymentIdSchema });

export type ConfirmCodInput = z.infer<typeof confirmCodSchema>;
