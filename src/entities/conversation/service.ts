import "server-only";
import { ApiError, apiFetch } from "@/lib/api/http";
import { productFromListItem, type RawProductListItem } from "@/entities/product/service";
import type { ChatMessage, Conversation, ConversationDetail } from "./types";

// FDD 3.1–3.4 — Hội thoại với trợ lý AI, gọi assistant-service qua gateway (NT.ASSISTANT_CONVERSATION).
// Web không gửi userId: gateway gắn danh tính từ cookie phiên; khách được nhận ra bằng cookie `guest_id`
// do backend cấp (apiFetch chuyển cookie này qua lại). Backend chặn người không phải chủ phiên (BR-14).

interface RawConversation {
  id: string;
  title: string | null;
  started_at: string;
}

interface RawMessage {
  id: string;
  sender: "user" | "agent";
  content: string;
  metadata: { products?: RawProductListItem[] } | null;
}

/** Tối đa backend cho một trang tin nhắn. */
const MESSAGES_LIMIT = 100;
const UNTITLED = "Hội thoại mới";

const toConversation = (raw: RawConversation): Conversation => ({
  id: raw.id,
  title: raw.title || UNTITLED,
  startedAt: raw.started_at,
});

function toMessage(raw: RawMessage): ChatMessage {
  const products = raw.metadata?.products?.map(productFromListItem) ?? [];
  return {
    id: raw.id,
    role: raw.sender === "user" ? "user" : "assistant",
    text: raw.content,
    ...(products.length && { products }),
  };
}

export const conversationService = {
  /** Hội thoại của người đang đăng nhập, mới nhất trước (backend chặn 100 phiên). */
  async listMine(): Promise<Conversation[]> {
    return (await apiFetch<RawConversation[]>("/api/conversations")).map(toConversation);
  },

  /** Một hội thoại kèm tin nhắn. Không có hoặc không phải của mình (404/403) → `null`. */
  async getMine(id: string): Promise<ConversationDetail | null> {
    const path = `/api/conversations/${encodeURIComponent(id)}`;
    try {
      const [conversation, messages] = await Promise.all([
        apiFetch<RawConversation>(path),
        apiFetch<{ data: RawMessage[] }>(`${path}/messages?limit=${MESSAGES_LIMIT}`),
      ]);
      return { ...toConversation(conversation), messages: messages.data.map(toMessage) };
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 403 || err.status === 400)) return null;
      throw err;
    }
  },

  /** Mở phiên mới. Khách chưa có cookie `guest_id` thì backend cấp. */
  async create(): Promise<string> {
    return (await apiFetch<{ id: string }>("/api/conversations", { method: "POST", body: { channel: "chat" } })).id;
  },

  /** Gửi câu hỏi, nhận câu trả lời của trợ lý (backend lưu cả hai; lỗi AI thì không lưu gì — BR-16). */
  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const raw = await apiFetch<RawMessage>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      body: { content },
    });
    return toMessage(raw);
  },

  /** Gán các hội thoại khách của thiết bị này vào tài khoản (FDD 3.3, BR-15). Trả số phiên đã gán. */
  async claim(): Promise<number> {
    return (await apiFetch<{ claimed: number }>("/api/conversations/claim", { method: "POST" })).claimed;
  },
};
