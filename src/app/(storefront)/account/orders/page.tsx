// FDD 5.2.1–5.2.2 — Danh sách đơn của tôi + lọc trạng thái (?status=). SSR: dữ liệu riêng của người dùng (mục 5).
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { routes } from "@/config/routes";
import { orderService } from "@/entities/order/service";
import { OrderList, OrderStatusFilter, ordersStyles, parseStatusFilter } from "@/features/orders";
import { requirePermission } from "@/lib/auth/guards";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "Đơn hàng của tôi",
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: Props) {
  await requirePermission("order:own");
  const status = parseStatusFilter((await searchParams).status);
  const orders = await orderService.listMine(status);

  return (
    <main className={ordersStyles.wrap}>
      <Breadcrumbs items={[{ label: "Trang chủ", href: routes.home }, { label: "Đơn hàng của tôi" }]} />
      <div>
        <h1 className={ordersStyles.title}>Đơn hàng của tôi</h1>
        <p className={ordersStyles.subtitle}>Theo dõi trạng thái và xem lại các đơn bạn đã đặt.</p>
      </div>
      <OrderStatusFilter active={status} />
      <OrderList orders={orders} filtered={status !== undefined} />
    </main>
  );
}
