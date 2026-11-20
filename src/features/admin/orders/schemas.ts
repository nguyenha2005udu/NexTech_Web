// FDD 8.2.3 — zod cho Server Action đổi trạng thái đơn (design/admin/04 §5).
// Backend (`UpdateOrderStatusDto`) chỉ nhận `shipped` | `cancelled`: admin không đặt `paid` bằng tay.
import { z } from "zod";

export const orderIdSchema = z.uuid("Mã đơn hàng không hợp lệ");

export const ADMIN_TARGET_STATUSES = ["shipped", "cancelled"] as const;
export type AdminTargetStatus = (typeof ADMIN_TARGET_STATUSES)[number];

export const updateOrderStatusSchema = z.object({
  id: orderIdSchema,
  status: z.enum(ADMIN_TARGET_STATUSES, "Trạng thái không hợp lệ"),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
