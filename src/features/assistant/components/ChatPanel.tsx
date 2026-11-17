"use client";

// FDD 3.1–3.3 — Khung chat với trợ lý AI (Figma 02.01, 02.02, 02.05).
// TODO(backend): thay phản hồi giả bằng stream từ /api/assistant/chat và chuyển state sang useAssistantStore (Zustand + sessionStorage).
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SparkleIcon } from "@/components/ui/icons";
import type { ChatMessage } from "@/entities/conversation";
import type { Product } from "@/entities/product";
import { MessageBubble } from "./MessageBubble";
import { SaveConversationDialog } from "./SaveConversationDialog";
import styles from "./Assistant.module.css";

const QUICK_QUESTIONS = ["Laptop học IT dưới 16 triệu", "Màn hình làm đồ họa", "Linh kiện PC chơi game"] as const;

const MOCK_REPLY: Omit<ChatMessage, "id"> = {
  role: "assistant",
  text: "Mình gợi ý hai mẫu có RAM 16 GB, SSD 512 GB, cân bằng giữa hiệu năng và giá. Bạn xem chi tiết bên dưới nhé.",
  productSlugs: ["asus-vivobook-15", "lenovo-ideapad-slim-5"],
};

type Props = {
  variant: "guest" | "user";
  initialMessages?: ChatMessage[];
  /** Sản phẩm có thể được AI gợi ý (đã tải ở server) */
  products: Product[];
  /** Hiện hộp thoại "Lưu hội thoại này?" ngay khi mở (khách vừa đăng nhập — FDD 3.3) */
  promptSave?: boolean;
  conversationTitle?: string;
};

export function ChatPanel({ variant, initialMessages = [], products, promptSave = false, conversationTitle }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [saveOpen, setSaveOpen] = useState(promptSave);
  const [saved, setSaved] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const title = conversationTitle ?? messages.find((m) => m.role === "user")?.text ?? "Hội thoại mới";

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setMessages((prev) => [...prev, { id: `u-${prev.length}`, role: "user", text: content }]);
    setDraft("");
    setPending(true);
    timerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, { ...MOCK_REPLY, id: `a-${prev.length}` }]);
      setPending(false);
    }, 700);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  const isGuest = variant === "guest";

  return (
    <section className={styles.card} aria-labelledby="assistant-title">
      <div className={styles.cardHead}>
        <span className={styles.headIcon}>
          <SparkleIcon size={20} />
        </span>
        <div className={styles.headText}>
          <h1 id="assistant-title" className={styles.cardTitle}>
            Trợ lý NexTech
          </h1>
          <p className={styles.cardSub}>Tư vấn thiết bị theo nhu cầu và ngân sách của bạn</p>
        </div>
        <span className={`${styles.badge} ${isGuest ? "" : styles.badgeUser}`}>
          {isGuest ? "Phiên khách" : "Đã đăng nhập"}
        </span>
      </div>

      <div ref={listRef} className={styles.messages} role="log" aria-live="polite" aria-label="Nội dung hội thoại">
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>Bạn đang tìm thiết bị để làm gì?</h2>
            <p className={styles.emptyText}>
              Cho mình biết mục đích sử dụng và ngân sách, mình sẽ gợi ý cấu hình phù hợp từ cửa hàng.
            </p>
            <div className={styles.chips}>
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} type="button" className={styles.chip} onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} products={products} />)
        )}
        {pending ? <p className={styles.typing}>NexTech AI đang soạn câu trả lời…</p> : null}
      </div>

      <div className={styles.composerWrap}>
        <form className={styles.composer} onSubmit={onSubmit}>
          <label htmlFor="assistant-input" className="sr-only">
            Nhập câu hỏi của bạn
          </label>
          <input
            id="assistant-input"
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            autoComplete="off"
          />
          <button type="submit" className={styles.send} disabled={pending || !draft.trim()}>
            Gửi
          </button>
        </form>
        {saved ? (
          <p className={styles.saved} role="status">
            Đã lưu hội thoại vào Lịch sử hội thoại.
          </p>
        ) : (
          <p className={styles.footnote}>
            {isGuest
              ? "Hội thoại của khách chỉ lưu trong phiên này. Đăng nhập để lưu lại."
              : "Trợ lý có thể sai sót, hãy kiểm tra lại thông số trước khi mua."}
          </p>
        )}
      </div>

      <SaveConversationDialog
        open={saveOpen}
        title={title}
        onSave={() => {
          setSaveOpen(false);
          setSaved(true);
        }}
        onSkip={() => setSaveOpen(false)}
      />
    </section>
  );
}
