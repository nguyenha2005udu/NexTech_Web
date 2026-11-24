// FDD 6.2 — Thông báo đơn hàng & thanh toán. SSR: dữ liệu riêng của người dùng (mục 5); noindex.
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { routes } from "@/config/routes";
import { notificationService } from "@/entities/notification/service";
import { NotificationList, notificationsStyles } from "@/features/notifications";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Thông báo",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requirePermission("notification:read");
  const initial = await notificationService.list();

  return (
    <main className={notificationsStyles.wrap}>
      <Breadcrumbs items={[{ label: "Trang chủ", href: routes.home }, { label: "Thông báo" }]} />
      <div>
        <h1 className={notificationsStyles.title}>Thông báo</h1>
        <p className={notificationsStyles.subtitle}>Cập nhật về đơn hàng, thanh toán và giá sản phẩm bạn theo dõi.</p>
      </div>
      <NotificationList initial={initial} />
    </main>
  );
}
