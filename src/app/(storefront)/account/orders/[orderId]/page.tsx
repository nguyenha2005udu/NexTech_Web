// FDD 5.2.3 + 5.2.4 + 5.2.5 — Chi tiết đơn, viết đánh giá, huỷ đơn. SSR; đơn của người khác → 404 (mục 10.3 lớp 2).
// Ghép feature: orders (chi tiết) + reviews (nút "Viết đánh giá" cho từng sản phẩm đủ điều kiện).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { orderService } from "@/entities/order/service";
import { reviewService } from "@/entities/review/service";
import { OrderDetail } from "@/features/orders";
import { ReviewButton, canReview } from "@/features/reviews";
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

  const itemActions: Record<string, React.ReactNode> = {};
  if (canReview(order)) {
    const reviewed = new Set(await reviewService.reviewedProductIds(order.id));
    for (const item of order.items) {
      itemActions[item.product_id] = reviewed.has(item.product_id) ? (
        <span>Đã đánh giá</span>
      ) : (
        <ReviewButton orderId={order.id} productId={item.product_id} productName={item.name} />
      );
    }
  }
  return <OrderDetail order={order} itemActions={itemActions} />;
}
