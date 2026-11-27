import type { Product } from "@/entities/product";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Sản phẩm thật trợ lý tra được kèm câu trả lời (FDD 3.2) */
  products?: Product[];
}

/** Một phiên hội thoại trong lịch sử (FDD 3.4). */
export interface Conversation {
  id: string;
  title: string;
  /** ISO 8601 */
  startedAt: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

/** Giới hạn độ dài một câu hỏi, khớp backend (`content` 1–2000 ký tự). */
export const CHAT_MESSAGE_MAX = 2000;
