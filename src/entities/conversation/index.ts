// Chỉ export type + hằng (dùng được ở client). Service ở server: "@/entities/conversation/service".
export type { ChatMessage, ChatRole, Conversation, ConversationDetail } from "./types";
export { CHAT_MESSAGE_MAX } from "./types";
