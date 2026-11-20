"use server";

// FDD 7.1 — Thêm / sửa / ẩn danh mục (design/admin/02 §2.3, §4). Lớp bảo vệ 3 (mục 10.3):
// requirePermission → zod → apiFetch → revalidatePath. Backend (gateway + catalog-service) kiểm quyền lại.
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import type { CategoryPayload } from "@/entities/category";
import { failed, invalid } from "@/lib/action-result";
import { apiFetch } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { categoryFormSchema, categoryIdSchema } from "./schemas";

function revalidateCategories() {
  revalidatePath(routes.admin.categories);
  revalidatePath(routes.home); // menu danh mục ở trang bán hàng
}

/** `id = null` → thêm mới (POST); có id → sửa (PATCH). */
export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult> {
  await requirePermission("category:manage");

  const parsedId = id === null ? null : categoryIdSchema.safeParse(id);
  if (parsedId && !parsedId.success) return { ok: false, message: "Mã danh mục không hợp lệ" };
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const body: CategoryPayload = parsed.data;
  try {
    await apiFetch(parsedId ? `/api/admin/categories/${parsedId.data}` : "/api/admin/categories", {
      method: parsedId ? "PATCH" : "POST",
      body,
    });
  } catch (err) {
    return failed(err);
  }
  revalidateCategories();
  return { ok: true };
}

/** Ẩn danh mục = xoá mềm (`DELETE /:id` chỉ đặt `isActive=false`) — ✅Q-C1. Không có xoá cứng trên UI. */
export async function hideCategory(id: unknown): Promise<ActionResult> {
  await requirePermission("category:manage");

  const parsed = categoryIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Mã danh mục không hợp lệ" };
  try {
    await apiFetch(`/api/admin/categories/${parsed.data}`, { method: "DELETE" });
  } catch (err) {
    return failed(err);
  }
  revalidateCategories();
  return { ok: true };
}
