"use client";

// FDD 6.2 — Nội dung dropdown của chuông: vài thông báo mới nhất, bấm để mở + đánh dấu đã đọc.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { isInternalLink, type Notification, type NotificationList } from "@/entities/notification";
import { routes } from "@/config/routes";
import { formatDateTime } from "@/lib/format";
import { useMarkNotificationsReadMutation } from "../api/notificationsApi";
import styles from "./Notifications.module.css";

type Props = { data: NotificationList | undefined; onNavigate: () => void };

export function NotificationPreview({ data, onNavigate }: Props) {
  const router = useRouter();
  const [markRead, { isLoading }] = useMarkNotificationsReadMutation();
  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  async function open(n: Notification) {
    onNavigate();
    // Lỗi đánh dấu không chặn việc mở thông báo; trang đích vẫn đúng, badge sẽ cập nhật ở lần polling sau.
    if (!n.is_read) await markRead({ ids: [n.id] }).unwrap().catch(() => undefined);
    if (n.link && isInternalLink(n.link)) router.push(n.link);
  }

  return (
    <div className={styles.panel} role="region" aria-label="Thông báo mới nhất">
      <div className={styles.panelHead}>
        <span className={styles.strong}>Thông báo</span>
        <Button size="small" type="link" disabled={unread === 0} loading={isLoading} onClick={() => markRead({})}>
          Đánh dấu tất cả đã đọc
        </Button>
      </div>
      {items.length ? (
        <ul className={styles.panelList}>
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" className={`${styles.panelItem} ${n.is_read ? "" : styles.unread}`} onClick={() => open(n)}>
                <span className={styles.strong}>{n.title}</span>
                <span className={styles.panelBody}>{n.body}</span>
                <time className={styles.muted} dateTime={n.created_at}>
                  {formatDateTime(n.created_at)}
                </time>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.panelEmpty}>Bạn chưa có thông báo nào.</p>
      )}
      <Link href={routes.notifications} className={styles.panelFoot} onClick={onNavigate}>
        Xem tất cả thông báo
      </Link>
    </div>
  );
}
