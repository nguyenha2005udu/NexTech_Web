// FDD 3.1–3.3 — Chat với trợ lý AI (Figma 02.01–02.03). CSR: tương tác liên tục, không cần SEO.
import type { Metadata } from "next";
import { routes } from "@/config/routes";
import { laptopItMessages } from "@/entities/conversation";
import { productService } from "@/entities/product/service";
import { AssistantShell, AssistantSidebar, ChatPanel } from "@/features/assistant";
import { orFallbackAtBuild } from "@/lib/build-safe";

export const metadata: Metadata = {
  title: "Trợ lý mua sắm AI",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const products = await orFallbackAtBuild(() => productService.listPopular(), []);
  // TODO(auth): bỏ `?demo=` khi có phiên thật. reply = Figma 02.02, save = Figma 02.03 (khách vừa đăng nhập).
  const { demo } = await searchParams;
  const showReply = demo === "reply" || demo === "save";

  return (
    <AssistantShell
      crumbs={[{ label: "Trang chủ", href: routes.home }, { label: "Trợ lý AI" }]}
      sidebar={<AssistantSidebar variant="guest" />}
    >
      <ChatPanel
        key={String(demo ?? "new")}
        variant={demo === "save" ? "user" : "guest"}
        initialMessages={showReply ? laptopItMessages : []}
        products={products}
        promptSave={demo === "save"}
        conversationTitle="Laptop học IT dưới 16 triệu"
      />
    </AssistantShell>
  );
}
