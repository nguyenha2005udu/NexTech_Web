import "server-only";
import { randomUUID } from "node:crypto";
import type { CreateOrderInput, CreatedOrder } from "./types";

// FDD 5.1.1 — Đơn hàng phía người mua. Gateway gắn danh tính từ cookie phiên; web không gửi userId.
// TODO(backend): thay mock bằng `apiFetch<CreatedOrder>("/api/orders", { method: "POST", body })` khi chốt
// hợp đồng order-service phía người mua. PayOS: backend tạo link thanh toán và trả `checkout_url`.
export const orderService = {
  async create(input: CreateOrderInput): Promise<CreatedOrder> {
    return {
      id: randomUUID(),
      status: input.payment_method === "cod" ? "pending" : "processing",
      total: input.total,
      payment_method: input.payment_method,
      checkout_url: null,
    };
  },
};
