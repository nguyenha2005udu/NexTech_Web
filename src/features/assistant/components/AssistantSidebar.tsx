import Link from "next/link";
import { ClockIcon, MessageIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import type { Conversation } from "@/entities/conversation";
import { NewChatLink } from "./NewChatLink";
import styles from "./Assistant.module.css";

type Props =
  | { variant: "guest" }
  | { variant: "user"; conversations: Conversation[]; activeId?: string; historyActive?: boolean };

// Cột trái: hội thoại mới, lịch sử, danh sách hội thoại (FDD 3.3–3.4).
export function AssistantSidebar(props: Props) {
  return (
    <aside className={styles.sidebar} aria-label="Hội thoại">
      <NewChatLink />

      {props.variant === "guest" ? (
        <>
          <Link href={routes.assistantHistory} className={styles.navLink}>
            <ClockIcon size={16} /> Lịch sử hội thoại
          </Link>
          <p className={styles.guestNote}>
            Bạn đang chat với tư cách khách, hội thoại chỉ lưu trong phiên này.{" "}
            <Link href={routes.loginWithCallback(routes.assistant)}>Đăng nhập</Link> để lưu lại.
          </p>
        </>
      ) : (
        <>
          <Link
            href={routes.assistantHistory}
            className={`${styles.navLink} ${props.historyActive ? styles.navActive : ""}`}
            aria-current={props.historyActive ? "page" : undefined}
          >
            <ClockIcon size={16} /> Lịch sử hội thoại
          </Link>
          <div className={styles.divider} role="presentation" />
          {props.conversations.map((c) => {
            const active = c.id === props.activeId;
            return (
              <Link
                key={c.id}
                href={routes.assistantConversation(c.id)}
                className={`${styles.navLink} ${active ? styles.navActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <MessageIcon size={16} /> {c.title}
              </Link>
            );
          })}
        </>
      )}
    </aside>
  );
}
