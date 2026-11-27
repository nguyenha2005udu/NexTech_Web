// FDD 6.1 — Cảnh báo giá: người dùng đặt giá mục tiêu cho một sản phẩm, backend báo khi giá chạm mục tiêu.
export interface PriceAlert {
  id: string;
  product_id: string;
  /** Báo khi giá hiện tại ≤ giá này (VND) */
  target_price: number;
  /** ISO 8601 */
  created_at: string;
  /** `triggered` = giá đã chạm mục tiêu và đã gửi thông báo (6.1.4, job của backend) */
  status: PriceAlertStatus;
}

/** Backend còn có `cancelled` (đã xoá) — không bao giờ trả ra khỏi service. */
export type PriceAlertStatus = "active" | "triggered";

/** Tối đa số cảnh báo giá mỗi người (chống rác) */
export const MAX_PRICE_ALERTS = 20;
