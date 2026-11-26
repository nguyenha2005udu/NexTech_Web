"use server";

// FDD 6.1.1 + 6.1.3 — Tạo / xoá cảnh báo giá. Server Action là endpoint công khai (mục 10.3):
// requirePermission("price-alert:manage") → zod → kiểm giá thật ở server → ghi.
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { MAX_PRICE_ALERTS } from "@/entities/price-alert";
import { priceAlertService } from "@/entities/price-alert/service";
import { productService } from "@/entities/product/service";
import { failed, invalid } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/guards";
import { formatVND } from "@/lib/format";
import type { ActionResult } from "@/types/action";
import { createPriceAlertSchema, removePriceAlertSchema } from "./schemas";

export async function createPriceAlert(input: unknown): Promise<ActionResult<{ alertId: string }>> {
  await requirePermission("price-alert:manage");
  const parsed = createPriceAlertSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const [product] = await productService.getManyByIds([parsed.data.productId]);
  if (!product) return { ok: false, message: "Sản phẩm không còn được bán" };
  // Giá hiện tại do server quyết định, không tin client (ISR có thể hiển thị giá cũ).
  if (parsed.data.targetPrice >= product.price) {
    const message = `Giá mục tiêu phải thấp hơn giá hiện tại (${formatVND(product.price)})`;
    return { ok: false, message, fieldErrors: { targetPrice: message } };
  }

  try {
    const mine = await priceAlertService.listMine();
    const isNew = !mine.some((a) => a.product_id === product.id);
    if (isNew && mine.length >= MAX_PRICE_ALERTS) {
      return { ok: false, message: `Bạn chỉ theo dõi được tối đa ${MAX_PRICE_ALERTS} sản phẩm` };
    }
    const alert = await priceAlertService.upsert(product.id, parsed.data.targetPrice);
    revalidatePath(routes.priceAlerts);
    return { ok: true, data: { alertId: alert.id } };
  } catch (err) {
    return failed(err);
  }
}

export async function removePriceAlert(input: unknown): Promise<ActionResult> {
  await requirePermission("price-alert:manage");
  const parsed = removePriceAlertSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (!(await priceAlertService.remove(parsed.data.alertId))) {
      return { ok: false, message: "Không tìm thấy cảnh báo giá" };
    }
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.priceAlerts);
  return { ok: true };
}
