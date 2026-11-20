"use server";

// FDD 8.3 — Mã giảm giá (design/admin/05 §1.4, §2.3, §4). Mỗi action: requirePermission("coupon:manage")
// → kiểm id + zod → apiFetch → revalidatePath. promotion-service kiểm quyền lại.
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { failed, invalid } from "@/lib/action-result";
import { apiFetch } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionFailure, ActionResult } from "@/types/action";
import { couponFormSchema, couponIdSchema, couponUpdateSchema, toCouponBody } from "./schemas";

const BASE = "/api/admin/discount-codes";
const INVALID_ID: ActionFailure = { ok: false, message: "Mã giảm giá không hợp lệ" };
/** 409 "Mã giảm giá đã tồn tại" → gắn vào ô Mã. */
const FIELD_BY_CODE = { "NT-PRM-1011": "code" } as const;

/** `id = null` → thêm (POST); có id → sửa (PUT, không gửi `code`). */
export async function saveCoupon(id: string | null, input: unknown): Promise<ActionResult> {
  await requirePermission("coupon:manage");
  if (id !== null && !couponIdSchema.safeParse(id).success) return INVALID_ID;

  const parsed = (id === null ? couponFormSchema : couponUpdateSchema).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (id === null) {
      await apiFetch(BASE, { method: "POST", body: toCouponBody(parsed.data, "create") });
    } else {
      await apiFetch(`${BASE}/${id}`, { method: "PUT", body: toCouponBody(parsed.data, "edit") });
    }
  } catch (err) {
    return failed(err, FIELD_BY_CODE);
  }
  revalidatePath(routes.admin.coupons);
  return { ok: true };
}

/** Tạm dừng (DELETE — backend chỉ đặt `is_active = false`) / Kích hoạt (PUT `{ is_active: true }`) — ✅Q-CP2. */
export async function toggleCoupon(id: unknown, active: unknown): Promise<ActionResult> {
  await requirePermission("coupon:manage");
  const parsedId = couponIdSchema.safeParse(id);
  if (!parsedId.success || typeof active !== "boolean") return INVALID_ID;

  try {
    await apiFetch(
      `${BASE}/${parsedId.data}`,
      active ? { method: "PUT", body: { is_active: true } } : { method: "DELETE" },
    );
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.admin.coupons);
  return { ok: true };
}
