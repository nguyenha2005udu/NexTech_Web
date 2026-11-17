export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Slug các sản phẩm trợ lý gợi ý kèm câu trả lời (FDD 3.2) */
  productSlugs?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  /** Nhãn thời gian hiển thị sẵn ("Hôm nay") — backend sẽ trả ISO date */
  updatedLabel: string;
  messages: ChatMessage[];
}
