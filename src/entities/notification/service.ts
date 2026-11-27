import "server-only";
import { routes } from "@/config/routes";
import { ApiError, apiFetch } from "@/lib/api/http";
import { NOTIFICATION_PAGE_SIZE, type Notification, type NotificationList, type NotificationType } from "./types";

// FDD 6.2 — Thông báo của CHÍNH người đang đăng nhập, gọi notification-service qua gateway (NT.NOTIFICATION).
// Gateway gắn danh tính từ cookie phiên; web không gửi userId. Thông báo do backend sinh từ sự kiện đơn hàng,
// thanh toán và theo dõi giá (job quét giá chạy ở catalog-service).

interface RawNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: { order_id?: string; product_id?: string } | null;
  is_read: boolean;
  created_at: string;
}

interface RawPage {
  items: RawNotification[];
  total: number;
  page: number;
}

/** Trang đích (6.2.2): đơn hàng → chi tiết đơn, theo dõi giá → trang sản phẩm. */
function linkOf(data: RawNotification["data"]): string | null {
  if (data?.order_id) return routes.orderDetail(data.order_id);
  if (data?.product_id) return routes.product(data.product_id);
  return null;
}

const toNotification = (raw: RawNotification): Notification => ({
  id: raw.id,
  type: raw.type,
  title: raw.title,
  body: raw.body ?? "",
  link: linkOf(raw.data),
  is_read: raw.is_read,
  created_at: raw.created_at,
});

export const notificationService = {
  /** Mới nhất trước, theo trang (`page` bắt đầu từ 1). `unread` và `total` tính trên toàn bộ. */
  async list(page = 1, pageSize = NOTIFICATION_PAGE_SIZE): Promise<NotificationList> {
    const [list, unread] = await Promise.all([
      apiFetch<RawPage>(`/api/notifications?page=${page}&limit=${pageSize}`),
      apiFetch<{ count: number }>("/api/notifications/unread-count"),
    ]);
    return { items: list.items.map(toNotification), unread: unread.count, page: list.page, total: list.total };
  },

  /** Đánh dấu đã đọc (FDD 6.2.2). Không truyền `ids` → tất cả. Id không tồn tại / của người khác bị bỏ qua. */
  async markRead(ids?: readonly string[]): Promise<void> {
    if (!ids) {
      await apiFetch("/api/notifications/read-all", { method: "PUT" });
      return;
    }
    await Promise.all(
      ids.map((id) =>
        apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PUT" }).catch((err: unknown) => {
          if (!(err instanceof ApiError && err.status === 404)) throw err;
        }),
      ),
    );
  },
};
