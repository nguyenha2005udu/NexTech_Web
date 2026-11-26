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

/** Mặc định / giới hạn số thông báo mỗi trang */
export const NOTIFICATION_PAGE_SIZE = 10;
export const NOTIFICATION_MAX_PAGE_SIZE = 50;

/** `GET /api/notifications?page=&limit=` — một trang, mới nhất trước, kèm tổng và số chưa đọc (cho badge ở chuông). */
export interface NotificationList {
  items: Notification[];
  /** Số chưa đọc của TOÀN BỘ thông báo, không chỉ trang này */
  unread: number;
  page: number;
  /** Tổng số thông báo (mọi trang) */
  total: number;
}
