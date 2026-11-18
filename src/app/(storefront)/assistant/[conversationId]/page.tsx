// FDD 3.4 — Xem lại một hội thoại (Figma 02.05). SSR: dữ liệu riêng của người dùng.
// TODO(backend): service phải lọc theo session.user.id khi thay mock bằng API.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { conversationService } from "@/entities/conversation/service";
import { productService } from "@/entities/product/service";
import { requirePermission } from "@/lib/auth/guards";
import { AssistantShell, AssistantSidebar, ChatPanel } from "@/features/assistant";

type Props = { params: Promise<{ conversationId: string }> };

export const metadata: Metadata = {
  title: "Hội thoại với trợ lý AI",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: Props) {
  await requirePermission("assistant:history");
  const { conversationId } = await params;
  const [conversation, conversations, products] = await Promise.all([
    conversationService.getMine(conversationId),
    conversationService.listMine(),
    productService.listPopular(),
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
      <ChatPanel
        variant="user"
        initialMessages={conversation.messages}
        products={products}
        conversationTitle={conversation.title}
      />
    </AssistantShell>
  );
}
