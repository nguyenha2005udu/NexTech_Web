"use client";

// FDD 6.2.1–6.2.2 — Danh sách thông báo: mở đơn / sản phẩm, đánh dấu đã đọc từng cái hoặc tất cả.
// Dữ liệu ban đầu do page (SSR) truyền vào để có nội dung ngay; sau đó dùng chung cache RTK Query với chuông.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Button, Tag } from "antd";
import { NOTIFICATION_TYPE_LABEL, isInternalLink, type Notification, type NotificationList as Data } from "@/entities/notification";
import { routes } from "@/config/routes";
import { formatDateTime } from "@/lib/format";
import { NOTIFICATION_POLL_MS, useGetNotificationsQuery, useMarkNotificationsReadMutation } from "../api/notificationsApi";
import { NotificationPager } from "./NotificationPager";
import styles from "./Notifications.module.css";

type Props = { initial: Data; pageSize: number };

export function NotificationList({ initial, pageSize }: Props) {
  const { data } = useGetNotificationsQuery(
    { page: initial.page, limit: pageSize },
    { pollingInterval: NOTIFICATION_POLL_MS },
  );
  const [markRead, { isLoading }] = useMarkNotificationsReadMutation();
  const router = useRouter();
  const { message } = App.useApp();
  const { items, unread, total, page } = data ?? initial;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function mark(ids?: string[]) {
    try {
      await markRead(ids ? { ids } : {}).unwrap();
    } catch {
      message.error("Không cập nhật được thông báo. Vui lòng thử lại.");
      return false;
    }
    return true;
  }

  async function open(n: Notification) {
    if (!n.is_read) await mark([n.id]);
    if (n.link && isInternalLink(n.link)) router.push(n.link);
  }

  if (!items.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.strong}>Bạn chưa có thông báo nào.</p>
        <p className={styles.muted}>
          Thông báo về đơn hàng, thanh toán và giá sản phẩm sẽ hiện ở đây.{" "}
          <Link href={routes.home} className={styles.link}>
            Tiếp tục mua sắm
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.muted} aria-live="polite">
          {unread > 0 ? `${unread} thông báo chưa đọc` : "Bạn đã đọc hết thông báo"}
        </span>
        <Button disabled={unread === 0} loading={isLoading} onClick={() => mark()}>
          Đánh dấu tất cả đã đọc
        </Button>
      </div>
      <ul className={styles.list}>
        {items.map((n) => (
          <li key={n.id} className={`${styles.item} ${n.is_read ? "" : styles.unread}`}>
            <div className={styles.itemHead}>
              <Tag>{NOTIFICATION_TYPE_LABEL[n.type]}</Tag>
              <time className={styles.muted} dateTime={n.created_at}>
                {formatDateTime(n.created_at)}
              </time>
            </div>
            <p className={styles.strong}>{n.title}</p>
            <p className={styles.muted}>{n.body}</p>
            <div className={styles.itemFoot}>
              {n.link && isInternalLink(n.link) ? (
                <Button type="link" className={styles.openButton} onClick={() => open(n)}>
                  Xem chi tiết
                </Button>
              ) : null}
              {!n.is_read ? (
                <Button type="text" onClick={() => mark([n.id])}>
                  Đánh dấu đã đọc
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <NotificationPager page={page} totalPages={totalPages} />
    </>
  );
}
