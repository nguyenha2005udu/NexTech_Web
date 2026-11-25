// FDD 6.2 — RTK Query cho thông báo (dữ liệu server cần refetch phía client, mục 7.1).
// Chuông ở header và trang /account/notifications dùng chung một cache → đánh dấu đã đọc ở đâu cũng cập nhật cả hai.
import type { NotificationList } from "@/entities/notification";
import { baseApi } from "@/lib/api/baseApi";

/** Polling 30s (giả định kỹ thuật #4); nâng lên SSE nếu backend hỗ trợ. */
export const NOTIFICATION_POLL_MS = 30_000;

/** Không truyền = trang đầu, cỡ mặc định. Chuông dùng `limit` nhỏ để chỉ lấy vài thông báo mới nhất. */
export interface NotificationsQuery {
  page?: number;
  limit?: number;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<NotificationList, NotificationsQuery | void>({
      query: (arg) => ({ url: "/notifications", params: { ...arg } }),
      providesTags: ["Notification"],
    }),
    /** Không truyền `ids` = đánh dấu tất cả đã đọc. */
    markNotificationsRead: build.mutation<{ ok: true }, { ids?: string[] } | void>({
      query: (arg) => ({ url: "/notifications/read", method: "POST", body: arg ?? {} }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkNotificationsReadMutation } = notificationsApi;
