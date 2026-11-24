// FDD 5.2.5 — Điều kiện huỷ đơn. Logic thuần, dùng ở UI (ẩn/hiện nút) và Server Action (kiểm thật).
import type { MyOrderSummary, OrderStatus } from "@/entities/order";

/** Người mua chỉ huỷ được khi đơn còn chờ xử lý và chưa thu tiền (đã thanh toán hoặc đang giao thì liên hệ cửa hàng). */
export function canCancel(order: Pick<MyOrderSummary, "status" | "payment_status">): boolean {
  return order.status === "pending" && order.payment_status !== "success";
}

/** 4 tab lọc ở danh sách đơn (Figma 04.05) — "Tất cả" là `undefined`. */
export const ORDER_FILTER_STATUSES = ["pending", "paid", "shipped", "cancelled"] as const satisfies readonly OrderStatus[];

export type OrderFilterStatus = (typeof ORDER_FILTER_STATUSES)[number];

/** `?status=` từ URL → trạng thái hợp lệ, giá trị lạ bị bỏ (về "Tất cả"). */
export function parseStatusFilter(raw: string | string[] | undefined): OrderFilterStatus | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return ORDER_FILTER_STATUSES.find((s) => s === value);
}
