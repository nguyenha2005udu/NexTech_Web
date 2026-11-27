// FDD 3.1–3.3 — Chat với trợ lý AI (Figma 02.01–02.03). Khung chat là Client Component; không cần SEO.
// Đọc phiên để biết khách hay người dùng (hỏi lưu hội thoại khách sau khi đăng nhập — FDD 3.3).
import type { Metadata } from "next";
import { routes } from "@/config/routes";
import { conversationService } from "@/entities/conversation/service";
import { AssistantShell, AssistantSidebar, ChatPanel } from "@/features/assistant";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Trợ lý mua sắm AI",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const user = await getSessionUser();
  // Danh sách ở cột trái chỉ là phụ: assistant-service lỗi thì vẫn cho chat (lỗi hiện ở khung chat khi gửi).
  const conversations = user ? await conversationService.listMine().catch(() => []) : [];

  return (
    <AssistantShell
      crumbs={[{ label: "Trang chủ", href: routes.home }, { label: "Trợ lý AI" }]}
      sidebar={
        user ? <AssistantSidebar variant="user" conversations={conversations} /> : <AssistantSidebar variant="guest" />
      }
    >
      <ChatPanel userId={user?.id ?? null} />
    </AssistantShell>
  );
}
