"use server";

// FDD 1.2.1 — Cập nhật thông tin cá nhân. requirePermission("profile:manage") → zod → apiFetch.
// Gateway lấy danh tính từ cookie phiên; identity-service kiểm tra lại quyền.
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { failed, invalid } from "@/lib/action-result";
import { apiFetch } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { profileFormSchema, toAccountBody, toShoppingBody } from "./schemas";

export async function updateProfile(input: unknown): Promise<ActionResult> {
  await requirePermission("profile:manage");
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    await apiFetch("/api/users/me", { method: "PUT", body: toAccountBody(parsed.data) });
    await apiFetch("/api/users/me/profile", { method: "PUT", body: toShoppingBody(parsed.data) });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.profile);
  return { ok: true };
}
