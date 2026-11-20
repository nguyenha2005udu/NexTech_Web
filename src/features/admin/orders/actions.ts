"use server";

// FDD 8.2.3 — Cập nhật trạng thái đơn (design/admin/04 §2.4, §5). requirePermission("order:manage") → zod
// → PUT /api/admin/orders/:id/status → revalidate bảng đơn + dashboard. order-service kiểm luật lại
// (NT-ORD-1007 chuyển sai, NT-ORD-1006 không có đơn, NT-ORD-1012 đơn đang bị khoá).
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { failed, invalid } from "@/lib/action-result";
import { apiFetch } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { updateOrderStatusSchema } from "./schemas";

export async function updateOrderStatus(input: unknown): Promise<ActionResult> {
  await requirePermission("order:manage");
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { id, status } = parsed.data;
  try {
    await apiFetch(`/api/admin/orders/${id}/status`, { method: "PUT", body: { status } });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.admin.orders);
  revalidatePath(routes.admin.dashboard);
  return { ok: true };
}
