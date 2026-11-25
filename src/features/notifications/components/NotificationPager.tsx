// FDD 6.2 — Phân trang danh sách thông báo bằng link (?page=): SSR được, chia sẻ link được (mục 7.1).
import Link from "next/link";
import { routes } from "@/config/routes";
import styles from "./Notifications.module.css";

type Props = { page: number; totalPages: number };

export function NotificationPager({ page, totalPages }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pager} aria-label="Phân trang thông báo">
      {page > 1 ? (
        <Link href={routes.notificationsPage(page - 1)} className={styles.pagerLink} rel="prev">
          ← Trang trước
        </Link>
      ) : (
        <span className={styles.pagerDisabled}>← Trang trước</span>
      )}
      <span className={styles.muted} aria-current="page">
        Trang {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={routes.notificationsPage(page + 1)} className={styles.pagerLink} rel="next">
          Trang sau →
        </Link>
      ) : (
        <span className={styles.pagerDisabled}>Trang sau →</span>
      )}
    </nav>
  );
}
