import "server-only";
import { randomUUID } from "node:crypto";
import type { Notification, NotificationList, NotificationType } from "./types";

// FDD 6.2 — Thông báo của CHÍNH người đang đăng nhập (gateway gắn danh tính từ cookie phiên; web không gửi userId).
// TODO(backend): thay mock bằng notification-service khi chốt hợp đồng:
//   list     → apiFetch<NotificationList>("/api/notifications")
//   markRead → apiFetch("/api/notifications/read", { method: "POST", body: { ids } })  (không có ids = tất cả)
// Mock giữ trong bộ nhớ tiến trình server; các service khác gọi `push` để sinh thông báo (đơn, thanh toán).
const store: Notification[] = [];

export interface NewNotification {
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

export const notificationService = {
  /** Mới nhất trước. */
  async list(): Promise<NotificationList> {
    const items = [...store].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { items, unread: items.filter((n) => !n.is_read).length };
  },

  /** Tạo thông báo (do backend sinh khi đơn/thanh toán đổi trạng thái; mock gọi trực tiếp). */
  async push(input: NewNotification): Promise<Notification> {
    const notification: Notification = {
      id: randomUUID(),
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    store.push(notification);
    return notification;
  },

  /** Đánh dấu đã đọc (FDD 6.2.2). Không truyền `ids` → tất cả. Id không tồn tại bị bỏ qua. */
  async markRead(ids?: readonly string[]): Promise<void> {
    for (const n of store) {
      if (!ids || ids.includes(n.id)) n.is_read = true;
    }
  },
};
