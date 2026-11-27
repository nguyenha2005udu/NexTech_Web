// FDD 5.2.3 + 5.2.4 + 5.2.5 — Chi tiết đơn, viết đánh giá, huỷ đơn. SSR; đơn của người khác → 404 (mục 10.3 lớp 2).
// Ghép feature: orders (chi tiết) + reviews (nút "Viết đánh giá" cho từng sản phẩm đủ điều kiện) + checkout (phương thức thanh toán đã nhớ).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { orderService } from "@/entities/order/service";
import { paymentMethodOf } from "@/features/checkout";
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

  // Backend chưa có API cho biết sản phẩm nào đã được đánh giá: nút luôn hiện, gửi trùng thì backend báo
  // "Bạn đã đánh giá sản phẩm này rồi" ngay trong hộp thoại.
  const itemActions: Record<string, React.ReactNode> = {};
  if (canReview(order)) {
    for (const item of order.items) {
      itemActions[item.product_id] = (
        <ReviewButton orderId={order.id} productId={item.product_id} productName={item.name} />
      );
    }
  }

  // Backend không trả phương thức ở API đơn: chỉ hiện khi cookie lúc đặt hàng còn và đúng đơn này (FDD 5.2.3).
  const paymentMethod = await paymentMethodOf(order.id);
  return <OrderDetail order={{ ...order, payment_method: paymentMethod }} itemActions={itemActions} />;
}
