import "server-only";
import { ApiError, apiFetch } from "@/lib/api/http";
import type { PriceAlert, PriceAlertStatus } from "./types";

// FDD 6.1 — Theo dõi giá của CHÍNH người đang đăng nhập, gọi catalog-service qua gateway (NT.CATALOG §1).
// Gateway gắn danh tính từ cookie phiên; web không gửi userId. Việc quét giá và gửi thông báo (6.1.4) là job
// của catalog-service (PRICE_ALERT_CRON) → thông báo hiện ở 6.2.

interface RawPriceAlert {
  id: string;
  product: { id: string };
  target_price: string | number;
  status: PriceAlertStatus | "cancelled";
  created_at: string;
}

export const priceAlertService = {
  /** Mới tạo trước. Bỏ cảnh báo đã xoá (backend giữ lại với trạng thái `cancelled`). */
  async listMine(): Promise<PriceAlert[]> {
    const rows = await apiFetch<RawPriceAlert[]>("/api/price-alerts");
    return rows.flatMap((r) =>
      r.status === "cancelled"
        ? []
        : [
            {
              id: r.id,
              product_id: r.product.id,
              target_price: Number(r.target_price),
              status: r.status,
              created_at: r.created_at,
            },
          ],
    );
  },

  /** Tạo cảnh báo (6.1.1). Đang theo dõi sản phẩm này rồi → backend báo 409 `NT-CAT-1008` (BR-12). */
  async create(
    productId: string,
    targetPrice: number,
  ): Promise<{ id: string }> {
    return apiFetch<{ id: string }>("/api/price-alerts", {
      method: "POST",
      body: { product_id: productId, target_price: targetPrice },
    });
  },

  /** Xoá cảnh báo (6.1.3). `false` khi id không thuộc người dùng. */
  async remove(id: string): Promise<boolean> {
    try {
      await apiFetch(`/api/price-alerts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return false;
      throw err;
    }
  },
};
