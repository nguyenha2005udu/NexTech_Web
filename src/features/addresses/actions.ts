"use server";

// FDD 1.2.2 — Thêm / sửa / đặt mặc định / xoá địa chỉ giao hàng của chính người dùng.
// requirePermission("profile:manage") → zod → addressService (gateway gắn danh tính từ cookie; identity-service
// kiểm lại địa chỉ có thuộc người dùng không).
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { addressService } from "@/entities/address/service";
import { failed, invalid } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { addressFormSchema, addressIdSchema, toAddressBody } from "./schemas";

const NOT_FOUND = { "NT-IDN-1004": "id" };

function refresh() {
  revalidatePath(routes.addresses);
  revalidatePath(routes.checkout);
}

export async function createAddress(input: unknown): Promise<ActionResult> {
  await requirePermission("profile:manage");
  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await addressService.create(toAddressBody(parsed.data));
  } catch (err) {
    return failed(err);
  }
  refresh();
  return { ok: true };
}

export async function updateAddress(id: unknown, input: unknown): Promise<ActionResult> {
  await requirePermission("profile:manage");
  const parsedId = addressIdSchema.safeParse({ id });
  if (!parsedId.success) return invalid(parsedId.error);
  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await addressService.update(parsedId.data.id, toAddressBody(parsed.data));
  } catch (err) {
    return failed(err, NOT_FOUND);
  }
  refresh();
  return { ok: true };
}

export async function setDefaultAddress(id: unknown): Promise<ActionResult> {
  await requirePermission("profile:manage");
  const parsed = addressIdSchema.safeParse({ id });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await addressService.setDefault(parsed.data.id);
  } catch (err) {
    return failed(err, NOT_FOUND);
  }
  refresh();
  return { ok: true };
}

export async function deleteAddress(id: unknown): Promise<ActionResult> {
  await requirePermission("profile:manage");
  const parsed = addressIdSchema.safeParse({ id });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await addressService.remove(parsed.data.id);
  } catch (err) {
    return failed(err, NOT_FOUND);
  }
  refresh();
  return { ok: true };
}
