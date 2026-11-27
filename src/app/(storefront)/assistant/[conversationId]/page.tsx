// FDD 3.4 — Xem lại một hội thoại (Figma 02.05). SSR: dữ liệu riêng của người dùng.
// Backend chỉ trả hội thoại của chính người gọi (BR-14); của người khác / không có → 404.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { conversationService } from "@/entities/conversation/service";
import { requirePermission } from "@/lib/auth/guards";
import { AssistantShell, AssistantSidebar, ChatPanel } from "@/features/assistant";

type Props = { params: Promise<{ conversationId: string }> };

export const metadata: Metadata = {
  title: "Hội thoại với trợ lý AI",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: Props) {
  const user = await requirePermission("assistant:history");
  const { conversationId } = await params;
  const [conversation, conversations] = await Promise.all([
    conversationService.getMine(conversationId),
    conversationService.listMine(),
  ]);
  if (!conversation) notFound();

  return (
    <AssistantShell
      crumbs={[
        { label: "Trang chủ", href: routes.home },
        { label: "Trợ lý AI", href: routes.assistant },
        { label: "Lịch sử", href: routes.assistantHistory },
        { label: conversation.title },
      ]}
      sidebar={<AssistantSidebar variant="user" conversations={conversations} activeId={conversation.id} />}
    >
      <ChatPanel key={conversation.id} userId={user.id} conversation={conversation} />
    </AssistantShell>
  );
}
