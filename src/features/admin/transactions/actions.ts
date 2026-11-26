"use server";

// FDD 8.2.6 — Xác nhận đã thu tiền COD (design/admin/06 §2). requirePermission("payment:confirm-cod") → zod
// → POST /api/admin/payments/:id/confirm-cod (order-service đổi giao dịch → success và đơn → paid trong một
// transaction) → revalidate Thanh toán + Đơn hàng + Tổng quan. Lỗi backend trả nguyên câu:
// NT-PAY-1008 không phải COD, NT-PAY-1009 không còn ở trạng thái chờ, NT-PAY-1001 không có giao dịch.
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { failed, invalid } from "@/lib/action-result";
import { apiFetch } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { confirmCodSchema } from "./schemas";

export async function confirmCodPayment(input: unknown): Promise<ActionResult> {
  await requirePermission("payment:confirm-cod");
  const parsed = confirmCodSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    // Body rỗng: backend (forbidNonWhitelisted) chặn trường lạ bằng 400
    await apiFetch(`/api/admin/payments/${parsed.data.id}/confirm-cod`, { method: "POST", body: {} });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.admin.transactions);
  revalidatePath(routes.admin.orders);
  revalidatePath(routes.admin.dashboard);
  return { ok: true };
}
