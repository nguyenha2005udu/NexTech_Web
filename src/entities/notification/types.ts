// FDD 6.2 — Thông báo của chính người dùng: đơn hàng, thanh toán, cảnh báo giá (6.1.4).
export type NotificationType = "order" | "payment" | "price_alert";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Đường dẫn nội bộ để mở đơn / sản phẩm (6.2.2); `null` khi không có trang đích */
  link: string | null;
  is_read: boolean;
  /** ISO 8601 */
  created_at: string;
}

/** `GET /api/notifications` — danh sách mới nhất trước kèm số chưa đọc (cho badge ở chuông). */
export interface NotificationList {
  items: Notification[];
  unread: number;
}
