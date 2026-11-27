"use client";

// FDD 3.1–3.3 — Khung chat với trợ lý AI (Figma 02.01, 02.02, 02.05).
// Câu trả lời lấy từ assistant-service qua Server Action (backend trả trọn câu, không stream).
// Ở /assistant hội thoại nằm trong useAssistantStore (sessionStorage); ở /assistant/[id] là hội thoại đã lưu.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SparkleIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { CHAT_MESSAGE_MAX, type ChatMessage, type ConversationDetail } from "@/entities/conversation";
import { saveGuestConversations, sendAssistantMessage, startAssistantConversation } from "../actions";
import { useAssistantStore } from "../model/useAssistantStore";
import { MessageBubble } from "./MessageBubble";
import { SaveConversationDialog } from "./SaveConversationDialog";
import styles from "./Assistant.module.css";

const QUICK_QUESTIONS = ["Laptop học IT dưới 16 triệu", "Màn hình làm đồ họa", "Linh kiện PC chơi game"] as const;

type Props = {
  /** Người đang đăng nhập, `null` = khách */
  userId: string | null;
  /** Hội thoại đã lưu (trang /assistant/[id]); không có = hội thoại theo phiên ở /assistant */
  conversation?: ConversationDetail;
};

export function ChatPanel({ userId, conversation }: Props) {
  const router = useRouter();
  const persisted = !conversation;

  const storeId = useAssistantStore((s) => s.conversationId);
  const storeMessages = useAssistantStore((s) => s.messages);
  const ownerId = useAssistantStore((s) => s.ownerId);
  const savePrompted = useAssistantStore((s) => s.savePrompted);
  const setConversation = useAssistantStore((s) => s.setConversation);
  const addStoreMessage = useAssistantStore((s) => s.addMessage);
  const removeStoreMessage = useAssistantStore((s) => s.removeMessage);
  const markSavePrompted = useAssistantStore((s) => s.markSavePrompted);
  const resetStore = useAssistantStore((s) => s.reset);

  const [localId, setLocalId] = useState(conversation?.id ?? null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(conversation?.messages ?? []);
  const [hydrated, setHydrated] = useState(!persisted);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const conversationId = persisted ? storeId : localId;
  const messages = persisted ? storeMessages : localMessages;

  // Nạp hội thoại theo phiên từ sessionStorage sau khi mount. Phiên của người khác (đăng xuất / đổi tài khoản
  // trong cùng tab) thì bỏ; phiên của khách thì giữ để hỏi lưu sau khi đăng nhập (FDD 3.3).
  useEffect(() => {
    if (!persisted) return;
    void Promise.resolve(useAssistantStore.persist.rehydrate()).then(() => {
      const owner = useAssistantStore.getState().ownerId;
      if (owner !== null && owner !== userId) useAssistantStore.getState().reset();
      setHydrated(true);
    });
  }, [persisted, userId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const isGuest = userId === null;
  const askSave = persisted && hydrated && !isGuest && ownerId === null && messages.length > 0 && !savePrompted;
  const title = conversation?.title ?? messages.find((m) => m.role === "user")?.text ?? "Hội thoại mới";

  function addMessage(message: ChatMessage) {
    if (persisted) addStoreMessage(message);
    else setLocalMessages((prev) => [...prev, message]);
  }

  function removeMessage(id: string) {
    if (persisted) removeStoreMessage(id);
    else setLocalMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function rememberConversation(id: string) {
    if (persisted) setConversation(id, userId);
    else setLocalId(id);
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    if (content.length > CHAT_MESSAGE_MAX) {
      setError(`Câu hỏi tối đa ${CHAT_MESSAGE_MAX} ký tự`);
      return;
    }
    const question: ChatMessage = { id: crypto.randomUUID(), role: "user", text: content };
    addMessage(question);
    setDraft("");
    setError(null);
    setPending(true);

    // Lỗi thì backend không lưu câu hỏi (BR-16): gỡ khỏi khung chat và trả lại ô nhập để gửi lại.
    const fail = (message: string) => {
      removeMessage(question.id);
      setDraft(content);
      setError(message);
      setPending(false);
    };

    let id = conversationId;
    if (!id) {
      const started = await startAssistantConversation();
      if (!started.ok) return fail(started.message);
      id = started.data.conversationId;
      rememberConversation(id);
    }
    const result = await sendAssistantMessage({ conversationId: id, content });
    if (!result.ok) return fail(result.message);
    if (result.data.conversationId !== id) rememberConversation(result.data.conversationId);
    addMessage(result.data.reply);
    setPending(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(draft);
  }

  async function saveConversation() {
    const id = conversationId;
    setSaving(true);
    const result = await saveGuestConversations();
    setSaving(false);
    markSavePrompted();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    // Đã gán vào tài khoản: mở bản đã lưu, bỏ bản tạm (FDD 3.3 — claim xong mới xoá).
    resetStore();
    if (id) router.push(routes.assistantConversation(id));
  }

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
        {messages.length === 0 && hydrated ? (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>Bạn đang tìm thiết bị để làm gì?</h2>
            <p className={styles.emptyText}>
              Cho mình biết mục đích sử dụng và ngân sách, mình sẽ gợi ý cấu hình phù hợp từ cửa hàng.
            </p>
            <div className={styles.chips}>
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} type="button" className={styles.chip} onClick={() => void send(q)} disabled={pending}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
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
            maxLength={CHAT_MESSAGE_MAX}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "assistant-error" : undefined}
          />
          <button type="submit" className={styles.send} disabled={pending || !draft.trim()}>
            Gửi
          </button>
        </form>
        {error ? (
          <p id="assistant-error" className={styles.error} role="alert">
            {error}
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
        open={askSave}
        title={title}
        saving={saving}
        onSave={() => void saveConversation()}
        onSkip={markSavePrompted}
      />
    </section>
  );
}
