import "server-only";
import { mockConversations } from "./mock-data";
import type { Conversation } from "./types";

// TODO(backend): thay mock bằng lib/api/http.ts; luôn lọc theo session.user.id (lớp 4 bảo vệ).
export const conversationService = {
  async listMine(): Promise<Conversation[]> {
    return mockConversations;
  },

  async getMine(id: string): Promise<Conversation | null> {
    return mockConversations.find((c) => c.id === id) ?? null;
  },
};
