import "server-only";
import { randomUUID } from "node:crypto";
import type { CreateOrderInput, CreatedOrder, MyOrderSummary } from "./types";

// FDD 5.1 — Đơn hàng phía người mua. Gateway gắn danh tính từ cookie phiên; web không gửi userId, và backend chỉ
// trả đơn của chính người đang đăng nhập (đơn của người khác → không tìm thấy).
// TODO(backend): thay mock bằng order-service khi chốt hợp đồng phía người mua:
//   create  → apiFetch<CreatedOrder>("/api/orders", { method: "POST", body })  (PayOS: backend trả `checkout_url`)
//   getMine → apiFetch<MyOrderSummary>(`/api/orders/${id}`)
// Mock giữ đơn trong bộ nhớ của tiến trình server để trang kết quả đọc lại được đơn vừa tạo.
const createdOrders = new Map<string, MyOrderSummary>();

export const orderService = {
  async create(input: CreateOrderInput): Promise<CreatedOrder> {
    const order: MyOrderSummary = {
      id: randomUUID(),
      status: input.payment_method === "cod" ? "pending" : "processing",
      total: input.total,
      payment_method: input.payment_method,
      payment_status: input.payment_method === "cod" ? null : "pending",
    };
    createdOrders.set(order.id, order);
    return { id: order.id, status: order.status, total: order.total, payment_method: order.payment_method, checkout_url: null };
  },

  /** `null` khi không có đơn hoặc đơn không thuộc người đang đăng nhập. */
  async getMine(id: string): Promise<MyOrderSummary | null> {
    return createdOrders.get(id) ?? null;
  },
};
