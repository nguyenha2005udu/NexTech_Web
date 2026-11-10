"use server";

// FDD 6.1.1 — Tạo cảnh báo giá.
// TODO(backend): cần auth() + can(role, "price-alert:manage") (mục 10.3) và lấy giá hiện tại
// từ backend để so với targetPrice — không tin giá client gửi lên. Hiện chỉ validate zod.
import type { ActionResult } from "@/types/action";
import { createPriceAlertSchema } from "./schemas";

export async function createPriceAlert(input: unknown): Promise<ActionResult> {
  const parsed = createPriceAlertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  return { ok: false, message: "Chưa kết nối máy chủ. Bạn cần đăng nhập để tạo cảnh báo giá." };
}
