"use server";

// FDD 8.4, 8.4.4 — Khoá / mở khoá, đổi vai trò người dùng (design/admin/07 §3). requirePermission("user:manage")
// → zod → chặn tự sửa chính mình (✅Q-U3, backend chưa chặn — BE-11) → PUT /api/admin/users/:id. Backend thu hồi
// refresh token khi khoá hoặc đổi vai trò. Lỗi backend trả nguyên câu (NT-IDN-1003 không tìm thấy người dùng).
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { failed, invalid } from "@/lib/action-result";
import { apiFetch } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { updateUserSchema } from "./schemas";
import { SELF_UPDATE_MESSAGE, isSelf } from "./user.rules";

export async function updateUser(input: unknown): Promise<ActionResult> {
  const me = await requirePermission("user:manage");
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { id, role, is_active } = parsed.data;
  if (isSelf(id, me.id)) return { ok: false, message: SELF_UPDATE_MESSAGE };

  try {
    await apiFetch(`/api/admin/users/${id}`, {
      method: "PUT",
      body: { ...(role !== undefined && { role }), ...(is_active !== undefined && { is_active }) },
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.admin.users);
  revalidatePath(routes.admin.dashboard);
  return { ok: true };
}
