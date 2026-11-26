import "server-only";
import { randomUUID } from "node:crypto";
import { NOTIFICATION_PAGE_SIZE, type Notification, type NotificationList, type NotificationType } from "./types";

// FDD 6.2 — Thông báo của CHÍNH người đang đăng nhập (gateway gắn danh tính từ cookie phiên; web không gửi userId).
// TODO(backend): thay mock bằng notification-service khi chốt hợp đồng:
//   list     → apiFetch<NotificationList>("/api/notifications?page=&limit=")
//   markRead → apiFetch("/api/notifications/read", { method: "POST", body: { ids } })  (không có ids = tất cả)
// Mock giữ trong bộ nhớ tiến trình server; các service khác gọi `push` để sinh thông báo (đơn, thanh toán).
// Gắn vào globalThis: Route Handler và Server Action được bundle riêng nên mỗi bên có bản module riêng —
// biến module thường sẽ không thấy thông báo do bên kia tạo. Bỏ khi dùng backend thật.
const globalStore = globalThis as typeof globalThis & { __nextechNotifications?: Notification[] };
const store: Notification[] = (globalStore.__nextechNotifications ??= []);

export interface NewNotification {
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

export const notificationService = {
  /** Mới nhất trước, theo trang (`page` bắt đầu từ 1). `unread` và `total` tính trên toàn bộ. */
  async list(page = 1, pageSize = NOTIFICATION_PAGE_SIZE): Promise<NotificationList> {
    const all = [...store].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      unread: all.filter((n) => !n.is_read).length,
      page,
      total: all.length,
    };
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
