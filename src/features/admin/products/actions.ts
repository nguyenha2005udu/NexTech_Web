"use server";

// FDD 7.2 — Sản phẩm & tồn kho (design/admin/03 §2–4). Mỗi action: requirePermission("product:manage")
// → kiểm id (UUID) + zod → apiFetch → revalidatePath. Backend (gateway + catalog-service) kiểm quyền lại.
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import type { AdminProductImage, AdminProductSpec, AdminProductTag } from "@/entities/product";
import { failed, invalid } from "@/lib/action-result";
import { apiFetch, apiFetchForm } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionFailure, ActionResult } from "@/types/action";
import {
  imageFileError,
  imageUrlSchema,
  productBasicSchema,
  productIdSchema,
  productSpecSchema,
  productTagSchema,
  productUpdateSchema,
  toProductBody,
} from "./schemas";

const INVALID_ID: ActionFailure = { ok: false, message: "Mã không hợp lệ" };
const BASE = "/api/admin/products";

const validIds = (...ids: unknown[]): boolean => ids.every((id) => productIdSchema.safeParse(id).success);

function revalidateProducts() {
  revalidatePath(routes.admin.products);
  revalidatePath(routes.product("[slug]"), "page"); // trang SP storefront (ISR)
}

/** Kiểm quyền → gọi API → revalidate. Lỗi backend (ApiError) thành ActionFailure. */
async function mutate<T>(request: () => Promise<T>): Promise<{ ok: true; data: T } | ActionFailure> {
  try {
    const data = await request();
    revalidateProducts();
    return { ok: true, data };
  } catch (err) {
    return failed(err);
  }
}

// ===== Tab "Thông tin cơ bản" + xoá =====

/** `id = null` → thêm (POST, đủ trường); có id → sửa (PUT, có thể chỉ gửi trường đã đổi — §2.7). */
export async function saveProduct(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  await requirePermission("product:manage");
  if (id !== null && !validIds(id)) return INVALID_ID;

  if (id === null) {
    const parsed = productBasicSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return mutate(async () => {
      const saved = await apiFetch<{ id: string }>(BASE, { method: "POST", body: toProductBody(parsed.data, "create") });
      return { id: saved.id };
    });
  }

  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return mutate(async () => {
    await apiFetch(`${BASE}/${id}`, { method: "PUT", body: toProductBody(parsed.data, "edit") });
    return { id };
  });
}

/** Xoá cứng (✅Q-P2) — backend xoá cả ảnh Cloudinary. */
export async function deleteProduct(id: unknown): Promise<ActionResult> {
  await requirePermission("product:manage");
  if (!validIds(id)) return INVALID_ID;
  const result = await mutate(() => apiFetch(`${BASE}/${id}`, { method: "DELETE" }));
  return result.ok ? { ok: true } : result;
}

// ===== Tab "Ảnh" =====

/**
 * Thêm ảnh: FormData gồm `productId`, và `file` (File) hoặc `imageUrl`; `isPrimary` = "true" để đặt làm ảnh chính.
 * Gửi multipart tới `POST /:id/images` (field `file` | `image_url`, `is_primary`).
 */
export async function addProductImage(formData: FormData): Promise<ActionResult<AdminProductImage>> {
  await requirePermission("product:manage");
  const productId = formData.get("productId");
  if (!validIds(productId)) return INVALID_ID;

  const body = new FormData();
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const error = imageFileError(file);
    if (error) return { ok: false, message: error, fieldErrors: { file: error } };
    body.append("file", file, file.name);
  } else {
    const url = imageUrlSchema.safeParse(String(formData.get("imageUrl") ?? "").trim());
    if (!url.success) {
      const message = url.error.issues[0]?.message ?? "URL ảnh không hợp lệ";
      return { ok: false, message, fieldErrors: { imageUrl: message } };
    }
    body.append("image_url", url.data);
  }
  body.append("is_primary", formData.get("isPrimary") === "true" ? "true" : "false");

  return mutate(() => apiFetchForm<AdminProductImage>(`${BASE}/${productId}/images`, body));
}

export async function setPrimaryImage(productId: unknown, imageId: unknown): Promise<ActionResult<AdminProductImage>> {
  await requirePermission("product:manage");
  if (!validIds(productId, imageId)) return INVALID_ID;
  return mutate(() =>
    apiFetch<AdminProductImage>(`${BASE}/${productId}/images/${imageId}`, { method: "PUT", body: { is_primary: true } }),
  );
}

export async function removeProductImage(productId: unknown, imageId: unknown): Promise<ActionResult> {
  await requirePermission("product:manage");
  if (!validIds(productId, imageId)) return INVALID_ID;
  const result = await mutate(() => apiFetch(`${BASE}/${productId}/images/${imageId}`, { method: "DELETE" }));
  return result.ok ? { ok: true } : result;
}

// ===== Tab "Thông số" =====

type SpecBody = { ok: true; body: { spec_key: string; spec_value: string; spec_unit: string | null } } | ActionFailure;

function specBody(input: unknown): SpecBody {
  const parsed = productSpecSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { key, value, unit } = parsed.data;
  // Đơn vị rỗng → null (backend chỉ bỏ qua khi undefined; null để xoá đơn vị cũ)
  return { ok: true, body: { spec_key: key, spec_value: value, spec_unit: unit || null } };
}

export async function addProductSpec(productId: unknown, input: unknown): Promise<ActionResult<AdminProductSpec>> {
  await requirePermission("product:manage");
  if (!validIds(productId)) return INVALID_ID;
  const spec = specBody(input);
  if (!spec.ok) return spec;
  return mutate(() => apiFetch<AdminProductSpec>(`${BASE}/${productId}/specs`, { method: "POST", body: spec.body }));
}

export async function updateProductSpec(
  productId: unknown,
  specId: unknown,
  input: unknown,
): Promise<ActionResult<AdminProductSpec>> {
  await requirePermission("product:manage");
  if (!validIds(productId, specId)) return INVALID_ID;
  const spec = specBody(input);
  if (!spec.ok) return spec;
  return mutate(() =>
    apiFetch<AdminProductSpec>(`${BASE}/${productId}/specs/${specId}`, { method: "PUT", body: spec.body }),
  );
}

export async function removeProductSpec(productId: unknown, specId: unknown): Promise<ActionResult> {
  await requirePermission("product:manage");
  if (!validIds(productId, specId)) return INVALID_ID;
  const result = await mutate(() => apiFetch(`${BASE}/${productId}/specs/${specId}`, { method: "DELETE" }));
  return result.ok ? { ok: true } : result;
}

// ===== Tab "Tags" =====

export async function addProductTag(productId: unknown, tag: unknown): Promise<ActionResult<AdminProductTag>> {
  await requirePermission("product:manage");
  if (!validIds(productId)) return INVALID_ID;
  const parsed = productTagSchema.safeParse(tag);
  if (!parsed.success) return invalid(parsed.error);
  const result = await mutate(() =>
    apiFetch<{ id: string; tag: string }>(`${BASE}/${productId}/tags`, { method: "POST", body: { tag: parsed.data } }),
  );
  return result.ok ? { ok: true, data: { id: result.data.id, name: result.data.tag } } : result;
}

export async function removeProductTag(productId: unknown, tagId: unknown): Promise<ActionResult> {
  await requirePermission("product:manage");
  if (!validIds(productId, tagId)) return INVALID_ID;
  const result = await mutate(() => apiFetch(`${BASE}/${productId}/tags/${tagId}`, { method: "DELETE" }));
  return result.ok ? { ok: true } : result;
}
