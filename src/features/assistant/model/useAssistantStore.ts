import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMessage } from "@/entities/conversation";

// FDD 3.3 — Hội thoại đang chat ở /assistant, giữ theo phiên trình duyệt (sessionStorage, mục 7.3).
// Backend mới là nơi lưu thật; store chỉ để tải lại trang không mất khung chat và để biết phiên nào của khách.
export interface AssistantState {
  conversationId: string | null;
  messages: ChatMessage[];
  /** Id người dùng mở phiên, `null` = khách. Khác người đang xem thì bỏ phiên (không lộ chat sang tài khoản khác). */
  ownerId: string | null;
  /** Đã hỏi "Lưu hội thoại này?" sau khi đăng nhập */
  savePrompted: boolean;
  setConversation: (conversationId: string, ownerId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (id: string) => void;
  markSavePrompted: () => void;
  reset: () => void;
}

const initial = { conversationId: null, messages: [], ownerId: null, savePrompted: false };

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      ...initial,
      setConversation: (conversationId, ownerId) => set({ conversationId, ownerId }),
      addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
      removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
      markSavePrompted: () => set({ savePrompted: true }),
      reset: () => set(initial),
    }),
    {
      name: "nextech-assistant",
      storage: createJSONStorage(() => sessionStorage),
      // Server render không có sessionStorage: nạp sau khi mount để tránh hydration mismatch.
      skipHydration: true,
      partialize: ({ conversationId, messages, ownerId, savePrompted }) => ({
        conversationId,
        messages,
        ownerId,
        savePrompted,
      }),
    },
  ),
);
