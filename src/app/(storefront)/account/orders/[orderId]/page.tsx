// FDD 5.2.3 + 5.2.5 — Chi tiết đơn + huỷ đơn. SSR; đơn của người khác → 404 (mục 10.3 lớp 2).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { orderService } from "@/entities/order/service";
import { OrderDetail } from "@/features/orders";
import { requirePermission } from "@/lib/auth/guards";

type Props = { params: Promise<{ orderId: string }> };

export const metadata: Metadata = {
  title: "Chi tiết đơn hàng",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: Props) {
  await requirePermission("order:own");
  const { orderId } = await params;
  const order = await orderService.getDetailMine(orderId);
  if (!order) notFound();
  return <OrderDetail order={order} />;
}
