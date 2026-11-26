// FDD 6.2 — Thông báo đơn hàng & thanh toán, phân trang ?page=. SSR: dữ liệu riêng của người dùng (mục 5); noindex.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { routes } from "@/config/routes";
import { NOTIFICATION_PAGE_SIZE, parsePage } from "@/entities/notification";
import { notificationService } from "@/entities/notification/service";
import { NotificationList, notificationsStyles } from "@/features/notifications";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Thông báo",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  await requirePermission("notification:read");
  const page = parsePage((await searchParams).page);
  const initial = await notificationService.list(page, NOTIFICATION_PAGE_SIZE);
  // Trang vượt quá số trang hiện có (ví dụ gõ tay ?page=99) → về trang cuối.
  const lastPage = Math.max(1, Math.ceil(initial.total / NOTIFICATION_PAGE_SIZE));
  if (page > lastPage) redirect(routes.notificationsPage(lastPage));

  return (
    <main className={notificationsStyles.wrap}>
      <Breadcrumbs items={[{ label: "Trang chủ", href: routes.home }, { label: "Thông báo" }]} />
      <div>
        <h1 className={notificationsStyles.title}>Thông báo</h1>
        <p className={notificationsStyles.subtitle}>Cập nhật về đơn hàng, thanh toán và giá sản phẩm bạn theo dõi.</p>
      </div>
      <NotificationList initial={initial} pageSize={NOTIFICATION_PAGE_SIZE} />
    </main>
  );
}
