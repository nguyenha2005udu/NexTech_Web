import "server-only";
import { randomUUID } from "node:crypto";
import { addressService } from "@/entities/address/service";
import { productService } from "@/entities/product/service";
import type { CreateOrderInput, CreatedOrder, MyOrderDetail, MyOrderSummary, OrderStatus } from "./types";

// FDD 5.1 + 5.2 — Đơn hàng phía người mua. Gateway gắn danh tính từ cookie phiên; web không gửi userId, và backend chỉ
// trả đơn của chính người đang đăng nhập (đơn của người khác → không tìm thấy).
// TODO(backend): thay mock bằng order-service khi chốt hợp đồng phía người mua:
//   create    → apiFetch<CreatedOrder>("/api/orders", { method: "POST", body })  (PayOS: backend trả `checkout_url`)
//   listMine  → apiFetch<MyOrderDetail[]>("/api/orders?status=")
//   getMine   → apiFetch<MyOrderDetail>(`/api/orders/${id}`)
//   cancel    → apiFetch(`/api/orders/${id}/cancel`, { method: "POST" })
// Mock giữ đơn trong bộ nhớ của tiến trình server để các trang đọc lại được đơn vừa tạo.
const orders = new Map<string, MyOrderDetail>();

function summaryOf(o: MyOrderDetail): MyOrderSummary {
  return { id: o.id, status: o.status, total: o.total, payment_method: o.payment_method, payment_status: o.payment_status };
}

export const orderService = {
  async create(input: CreateOrderInput): Promise<CreatedOrder> {
    const [products, address] = await Promise.all([
      productService.getManyByIds(input.items.map((i) => i.product_id)),
      addressService.getMine(input.address_id),
    ]);
    const order: MyOrderDetail = {
      id: randomUUID(),
      status: input.payment_method === "cod" ? "pending" : "processing",
      total: input.total,
      payment_method: input.payment_method,
      payment_status: input.payment_method === "cod" ? null : "pending",
      created_at: new Date().toISOString(),
      items: input.items.map((i) => ({
        product_id: i.product_id,
        name: products.find((p) => p.id === i.product_id)?.name ?? "Sản phẩm",
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      shipping: address
        ? { recipient_name: address.recipient_name, phone_number: address.phone_number, full_address: address.full_address }
        : null,
      subtotal: input.subtotal,
      shipping_fee: input.shipping_fee,
      discount_amount: input.discount_amount,
      discount_code: input.discount_code,
    };
    orders.set(order.id, order);
    return { id: order.id, status: order.status, total: order.total, payment_method: order.payment_method, checkout_url: null };
  },

  /**
   * Tạo lại link thanh toán PayOS cho đơn chưa thanh toán xong (FDD 5.1.2 "Thử lại").
   * TODO(backend): POST /api/orders/:id/payments → `{ checkout_url }`. Chưa có API nên mock trả `null`.
   */
  async retryPayment(id: string): Promise<{ checkout_url: string | null }> {
    void id;
    return { checkout_url: null };
  },

  /** Trạng thái đơn cho trang kết quả. `null` khi không có đơn hoặc đơn không thuộc người đang đăng nhập. */
  async getMine(id: string): Promise<MyOrderSummary | null> {
    const order = orders.get(id);
    return order ? summaryOf(order) : null;
  },

  /** Chi tiết đơn (FDD 5.2.3). `null` khi không có đơn hoặc đơn không thuộc người đang đăng nhập. */
  async getDetailMine(id: string): Promise<MyOrderDetail | null> {
    return orders.get(id) ?? null;
  },

  /** Đơn của tôi, mới nhất trước; lọc theo trạng thái nếu có (FDD 5.2.1–5.2.2). */
  async listMine(status?: OrderStatus): Promise<MyOrderDetail[]> {
    return [...orders.values()]
      .filter((o) => !status || o.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  /** Huỷ đơn (FDD 5.2.5). Điều kiện huỷ do `canCancel` kiểm trước; backend kiểm lại. `null` khi không có đơn. */
  async cancel(id: string): Promise<MyOrderDetail | null> {
    const order = orders.get(id);
    if (!order) return null;
    const cancelled: MyOrderDetail = { ...order, status: "cancelled" };
    orders.set(id, cancelled);
    return cancelled;
  },
};
