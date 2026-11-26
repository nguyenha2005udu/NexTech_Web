"use server";

// FDD 5.2.4 — Viết đánh giá sản phẩm đã mua. Server Action là endpoint công khai (mục 10.3):
// requirePermission("review:create") → zod → đơn phải là CỦA CHÍNH người dùng, đủ điều kiện, có sản phẩm đó,
// chưa đánh giá → ghi → revalidate trang sản phẩm (ISR) và chi tiết đơn.
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { orderService } from "@/entities/order/service";
import { productService } from "@/entities/product/service";
import { reviewService } from "@/entities/review/service";
import { failed, invalid } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { canReview } from "./review.rules";
import { createReviewSchema } from "./schemas";

export async function createReview(input: unknown): Promise<ActionResult<{ reviewId: string }>> {
  await requirePermission("review:create");
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { orderId, productId, rating, content } = parsed.data;

  const order = await orderService.getDetailMine(orderId);
  if (!order) return { ok: false, message: "Không tìm thấy đơn hàng" };
  if (!canReview(order)) return { ok: false, message: "Bạn chỉ đánh giá được sản phẩm của đơn đã thanh toán hoặc đang giao" };
  if (!order.items.some((i) => i.product_id === productId)) {
    return { ok: false, message: "Sản phẩm này không có trong đơn hàng" };
  }
  if ((await reviewService.reviewedProductIds(orderId)).includes(productId)) {
    return { ok: false, message: "Bạn đã đánh giá sản phẩm này rồi" };
  }

  try {
    const review = await reviewService.create({ orderId, productId, rating, content });
    const [product] = await productService.getManyByIds([productId]);
    if (product) revalidatePath(routes.product(product.slug));
    revalidatePath(routes.orderDetail(orderId));
    return { ok: true, data: { reviewId: review.id } };
  } catch (err) {
    return failed(err);
  }
}
