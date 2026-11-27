// FDD 5.2.4 — Điều kiện viết đánh giá. Logic thuần, dùng ở UI (ẩn/hiện nút) và Server Action (kiểm thật).
import type { OrderStatus } from "@/entities/order";

/** Chỉ đơn đã thu tiền hoặc đang giao mới đánh giá được (đơn chờ xử lý / đã huỷ / thất bại thì chưa mua xong). */
const REVIEWABLE_STATUSES: readonly OrderStatus[] = ["paid", "shipped"];

export function canReview(order: { status: OrderStatus }): boolean {
  return REVIEWABLE_STATUSES.includes(order.status);
}
