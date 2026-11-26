import "server-only";
import { randomUUID } from "node:crypto";
import { notificationService } from "@/entities/notification/service";
import { productService } from "@/entities/product/service";
import { formatVND } from "@/lib/format";
import { routes } from "@/config/routes";
import type { PriceAlert } from "./types";

// FDD 6.1 — Cảnh báo giá của CHÍNH người đang đăng nhập (gateway gắn danh tính; web không gửi userId).
// TODO(backend): thay mock bằng price-alert-service khi chốt hợp đồng:
//   listMine → apiFetch<PriceAlert[]>("/api/price-alerts")
//   upsert   → apiFetch("/api/price-alerts", { method: "PUT", body: { product_id, target_price } })
//   remove   → apiFetch(`/api/price-alerts/${id}`, { method: "DELETE" })
// Việc quét giá và gửi thông báo (6.1.4) là job của backend; mock chỉ giả lập bằng `evaluate()`.
// Gắn vào globalThis vì Route Handler và Server Action được bundle riêng (xem notification/service).
const globalStore = globalThis as typeof globalThis & { __nextechPriceAlerts?: PriceAlert[] };
const store: PriceAlert[] = (globalStore.__nextechPriceAlerts ??= []);

export const priceAlertService = {
  /** Mới tạo trước. Mỗi lần xem danh sách mock chạy lại bước quét giá. */
  async listMine(): Promise<PriceAlert[]> {
    await priceAlertService.evaluate();
    return [...store].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async count(): Promise<number> {
    return store.length;
  },

  /** Mỗi sản phẩm một cảnh báo: đặt lại giá mục tiêu thì ghi đè và theo dõi lại từ đầu (6.1.1). */
  async upsert(productId: string, targetPrice: number): Promise<PriceAlert> {
    const existing = store.find((a) => a.product_id === productId);
    if (existing) {
      existing.target_price = targetPrice;
      existing.triggered_at = null;
      return existing;
    }
    const alert: PriceAlert = {
      id: randomUUID(),
      product_id: productId,
      target_price: targetPrice,
      created_at: new Date().toISOString(),
      triggered_at: null,
    };
    store.push(alert);
    return alert;
  },

  /** Xoá cảnh báo (6.1.3). `false` khi id không thuộc người dùng. */
  async remove(id: string): Promise<boolean> {
    const index = store.findIndex((a) => a.id === id);
    if (index < 0) return false;
    store.splice(index, 1);
    return true;
  },

  /** Giả lập job backend (6.1.4): giá hiện tại ≤ mục tiêu thì gửi thông báo đúng một lần. */
  async evaluate(): Promise<void> {
    const pending = store.filter((a) => !a.triggered_at);
    if (!pending.length) return;
    const products = await productService.getManyByIds(pending.map((a) => a.product_id));
    for (const alert of pending) {
      const product = products.find((p) => p.id === alert.product_id);
      if (!product || product.price > alert.target_price) continue;
      alert.triggered_at = new Date().toISOString();
      await notificationService.push({
        type: "price_alert",
        title: "Giá đã chạm mục tiêu",
        body: `${product.name} hiện ${formatVND(product.price)}, thấp hơn mức bạn đặt ${formatVND(alert.target_price)}.`,
        link: routes.product(product.slug),
      });
    }
  },
};
