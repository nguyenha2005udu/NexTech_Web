import Link from "next/link";
import { ArrowRightIcon, ClockIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import type { Conversation } from "@/entities/conversation";
import { formatDate } from "@/lib/format";
import styles from "./Assistant.module.css";

// FDD 3.4 — Danh sách lịch sử hội thoại (Figma 02.04).
export function ConversationHistoryList({ conversations }: { conversations: Conversation[] }) {
  return (
    <section className={styles.card} aria-labelledby="history-title">
      <div className={styles.cardHead}>
        <span className={styles.headIcon}>
          <ClockIcon size={20} />
        </span>
        <div className={styles.headText}>
          <h1 id="history-title" className={styles.cardTitle}>
            Lịch sử hội thoại
          </h1>
          <p className={styles.cardSub}>Các hội thoại bạn đã lưu vào tài khoản</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeUser}`}>Đã đăng nhập</span>
      </div>
      {conversations.length ? (
        <ul className={styles.historyList}>
          {conversations.map((c) => (
            <li key={c.id} className={styles.historyItem}>
              <div>
                <p className={styles.historyTitle}>{c.title}</p>
                <p className={styles.historyTime}>
                  <time dateTime={c.startedAt}>{formatDate(c.startedAt)}</time>
                </p>
              </div>
              <Link href={routes.assistantConversation(c.id)} className={styles.ghostBtn} style={{ marginTop: 0 }}>
                <ArrowRightIcon size={14} /> Mở hội thoại
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.historyEmpty}>Bạn chưa lưu hội thoại nào.</p>
      )}
    </section>
  );
}
