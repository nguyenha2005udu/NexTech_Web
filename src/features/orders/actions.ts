"use server";

// FDD 5.2.5 — Huỷ đơn. Server Action là endpoint công khai nên đủ lớp bảo vệ (mục 10.3):
// requirePermission("order:own") → zod → lấy đơn CỦA CHÍNH người dùng → canCancel → huỷ → revalidate.
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { orderService } from "@/entities/order/service";
import { failed, invalid } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { canCancel } from "./order.rules";
import { cancelOrderSchema } from "./schemas";

export async function cancelOrder(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  await requirePermission("order:own");
  const parsed = cancelOrderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const order = await orderService.getMine(parsed.data.orderId);
  if (!order) return { ok: false, message: "Không tìm thấy đơn hàng" };
  if (!canCancel(order)) return { ok: false, message: "Đơn hàng này không còn huỷ được" };

  try {
    await orderService.cancel(order.id);
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.orderLookup);
  revalidatePath(routes.orderDetail(order.id));
  return { ok: true, data: { orderId: order.id } };
}
