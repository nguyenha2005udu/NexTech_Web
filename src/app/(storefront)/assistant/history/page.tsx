// FDD 3.4 — Lịch sử hội thoại (Figma 02.04). SSR: dữ liệu riêng của người dùng.
// TODO(auth): requirePermission('assistant:history') trước khi lấy dữ liệu.
import type { Metadata } from "next";
import { routes } from "@/config/routes";
import { conversationService } from "@/entities/conversation/service";
import { AssistantShell, AssistantSidebar, ConversationHistoryList } from "@/features/assistant";

export const metadata: Metadata = {
  title: "Lịch sử hội thoại",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const conversations = await conversationService.listMine();

  return (
    <AssistantShell
      crumbs={[
        { label: "Trang chủ", href: routes.home },
        { label: "Trợ lý AI", href: routes.assistant },
        { label: "Lịch sử" },
      ]}
      sidebar={<AssistantSidebar variant="user" conversations={conversations} historyActive />}
    >
      <ConversationHistoryList conversations={conversations} />
    </AssistantShell>
  );
}
