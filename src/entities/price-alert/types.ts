// FDD 6.1 — Cảnh báo giá: người dùng đặt giá mục tiêu cho một sản phẩm, backend báo khi giá chạm mục tiêu.
export interface PriceAlert {
  id: string;
  product_id: string;
  /** Báo khi giá hiện tại ≤ giá này (VND) */
  target_price: number;
  /** ISO 8601 */
  created_at: string;
  /** Đã gửi thông báo khi chạm mục tiêu (6.1.4); `null` = còn đang theo dõi */
  triggered_at: string | null;
}

/** Tối đa số cảnh báo giá mỗi người (chống rác) */
export const MAX_PRICE_ALERTS = 20;
