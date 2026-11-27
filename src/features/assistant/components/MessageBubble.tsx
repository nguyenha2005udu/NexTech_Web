import { SparkleSmallIcon } from "@/components/ui/icons";
import type { ChatMessage } from "@/entities/conversation";
import { SuggestedProductCard } from "./SuggestedProductCard";
import styles from "./Assistant.module.css";

// Bong bóng tin nhắn: người dùng (phải, nền cam nhạt) / NexTech AI (trái, kèm sản phẩm gợi ý).
export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className={styles.userRow}>
        <p className={styles.userBubble}>{message.text}</p>
      </div>
    );
  }

  const suggested = message.products ?? [];

  return (
    <div className={styles.botBubble}>
      <p className={styles.botName}>
        <SparkleSmallIcon size={14} /> NexTech AI
      </p>
      <p className={styles.botText}>{message.text}</p>
      {suggested.length ? (
        <div className={styles.suggestions} style={{ marginTop: 12 }}>
          {suggested.map((p) => (
            <SuggestedProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
