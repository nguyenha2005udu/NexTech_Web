import "server-only";
import { randomUUID } from "node:crypto";
import type { PaymentStatus } from "@/entities/transaction";
import { ApiError, apiFetch } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import type {
  CreateOrderInput,
  CreatedOrder,
  MyOrderDetail,
  MyOrderListItem,
  MyOrderSummary,
  OrderStatus,
} from "./types";

// FDD 5.1 + 5.2 — Đơn hàng phía người mua, nối order-service qua API Gateway. Gateway gắn danh tính từ cookie phiên;
// web không gửi userId, và backend chỉ trả đơn của chính người đang đăng nhập (đơn người khác → 404).
//
// Backend đặt đơn theo GIỎ HÀNG TRÊN SERVER (`/api/cart`), còn giỏ của web là local. Vì vậy `create` đẩy đúng các dòng
// vừa chọn vào giỏ backend rồi đặt bằng `cart_item_ids`. Giá, phí ship, giảm giá do backend tính — web chỉ hiển thị.

interface RawCart {
  id: string;
  items: Array<{ id: string; product: { id: string }; quantity: number }>;
}
interface RawCreated {
  id: string;
  status: OrderStatus;
  total?: string | number;
}
interface RawShipping {
  full_address: string;
  recipient_name: string | null;
  phone_number: string | null;
}
interface RawOrderDetail {
  id: string;
  status: OrderStatus;
  created_at: string;
  subtotal: string | number;
  shipping_fee: string | number;
  discount_amount: string | number;
  shipping_discount_amount?: string | number;
  total: string | number;
  items: Array<{ product: { id: string; name: string | null; price: string | number }; quantity: number }>;
  shipping_address: RawShipping | null;
}
interface RawListItem {
  id: string;
  total: string | number;
  status: OrderStatus;
  created_at: string;
  item_count: number;
  product_name: string | null;
  product_image: string | null;
}
interface RawPayment {
  id: string;
  payment_url: string | null;
}
interface RawPaymentStatus {
  id: string;
  status: PaymentStatus;
  paid_at: string | null;
}

const LIST_LIMIT = 100;

/** Backend không trả trạng thái thanh toán ở API đơn: suy ra từ trạng thái đơn. */
export function paymentStatusOf(status: OrderStatus): PaymentStatus {
  if (status === "paid" || status === "shipped" || status === "simulated_success") return "success";
  if (status === "cancelled" || status === "failed") return "failed";
  return "pending";
}

const isMissing = (err: unknown) => err instanceof ApiError && (err.status === 404 || err.status === 400);
/** Giao dịch của người khác (403 NT-PAY-1007) hay không có / sai định dạng id đều coi như "không có" với người gọi. */
const isNotMine = (err: unknown) => isMissing(err) || (err instanceof ApiError && err.status === 403);

function toDetail(raw: RawOrderDetail): MyOrderDetail {
  return {
    id: raw.id,
    status: raw.status,
    total: Number(raw.total),
    payment_method: null,
    payment_status: paymentStatusOf(raw.status),
    created_at: raw.created_at,
    items: raw.items.map((i) => ({
      product_id: i.product.id,
      name: i.product.name ?? "Sản phẩm",
      quantity: i.quantity,
      unit_price: Number(i.product.price),
    })),
    shipping: raw.shipping_address && {
      recipient_name: raw.shipping_address.recipient_name ?? "",
      phone_number: raw.shipping_address.phone_number ?? "",
      full_address: raw.shipping_address.full_address,
    },
    subtotal: Number(raw.subtotal),
    shipping_fee: Number(raw.shipping_fee),
    // Một dòng "Giảm giá" cho cả giảm đơn lẫn giảm phí vận chuyển (mã freeship) để tổng hiển thị cộng đúng.
    discount_amount: Number(raw.discount_amount) + Number(raw.shipping_discount_amount ?? 0),
    // Backend không trả mã đã dùng ở API đơn.
    discount_code: null,
  };
}

/** Đưa đúng các dòng cần đặt vào giỏ backend (cập nhật số lượng nếu đã có) và trả id các dòng giỏ tương ứng. */
async function syncCart(items: CreateOrderInput["items"]): Promise<string[]> {
  const cart = await apiFetch<RawCart>("/api/cart");
  const ids: string[] = [];
  for (const item of items) {
    const existing = cart.items.find((c) => c.product.id === item.product_id);
    if (existing) {
      if (existing.quantity !== item.quantity) {
        await apiFetch(`/api/cart/items/${existing.id}`, { method: "PUT", body: { quantity: item.quantity } });
      }
      ids.push(existing.id);
    } else {
      const added = await apiFetch<{ id: string }>("/api/cart/items", {
        method: "POST",
        body: { product_id: item.product_id, quantity: item.quantity },
      });
      ids.push(added.id);
    }
  }
  return ids;
}

function requestPayment(orderId: string, method: CreateOrderInput["payment_method"]) {
  return apiFetch<RawPayment>("/api/payments", { method: "POST", body: { order_id: orderId, method } });
}

export const orderService = {
  async create(input: CreateOrderInput): Promise<CreatedOrder> {
    const cartItemIds = await syncCart(input.items);
    const order = await apiFetch<RawCreated>("/api/orders", {
      method: "POST",
      // Chống bấm đúp: cùng khoá thì backend trả lại đơn cũ.
      headers: { "Idempotency-Key": randomUUID() },
      body: {
        address_id: input.address_id,
        cart_item_ids: cartItemIds,
        ...(input.discount_code && { discount_code: input.discount_code }),
        ...(input.freeship_code && { freeship_code: input.freeship_code }),
      },
    });

    let checkoutUrl: string | null = null;
    let paymentId: string | null = null;
    // 202: đơn còn `processing` (saga chưa xong) → chưa tạo thanh toán được, trang kết quả sẽ hiện "đang xử lý".
    if (order.status === "pending") {
      try {
        const payment = await requestPayment(order.id, input.payment_method);
        checkoutUrl = payment.payment_url;
        paymentId = payment.id;
      } catch (err) {
        // Đơn đã tạo: không báo lỗi đặt hàng. Người dùng xem kết quả và thử lại thanh toán ở đó.
        if (!(err instanceof ApiError)) throw err;
      }
    }
    return {
      id: order.id,
      status: order.status,
      total: Number(order.total ?? 0),
      payment_method: input.payment_method,
      payment_id: paymentId,
      checkout_url: input.payment_method === "payos" ? checkoutUrl : null,
    };
  },

  /**
   * Tạo giao dịch cho đơn đã `pending` (FDD 5.1.2). Dùng khi đơn đặt lúc backend trả 202 `processing` (lúc đó chưa tạo được),
   * và để thanh toán lại PayOS: giao dịch `failed` được backend dùng lại với mã PayOS mới (BR-08, cùng id giao dịch).
   * Backend: 400 nếu đơn không còn `pending`, 409 `NT-PAY-1003` nếu đã có giao dịch chưa `failed`.
   */
  async createPayment(id: string, method: CreateOrderInput["payment_method"]): Promise<{ id: string; checkout_url: string | null }> {
    const payment = await requestPayment(id, method);
    return { id: payment.id, checkout_url: method === "payos" ? payment.payment_url : null };
  },

  /**
   * Trạng thái giao dịch (`GET /api/payments/:id/status`). Giao dịch PayOS còn `pending` thì backend CHỦ ĐỘNG hỏi PayOS
   * rồi đồng bộ đơn (webhook không gọi được vào localhost) — nên gọi trước khi đọc đơn. `null` khi giao dịch không
   * thuộc người đang đăng nhập hoặc không tồn tại.
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    try {
      return (await apiFetch<RawPaymentStatus>(`/api/payments/${encodeURIComponent(paymentId)}/status`)).status;
    } catch (err) {
      if (isNotMine(err)) return null;
      throw err;
    }
  },

  /** Trạng thái đơn cho trang kết quả. `null` khi không có đơn hoặc đơn không thuộc người đang đăng nhập. */
  async getMine(id: string): Promise<MyOrderSummary | null> {
    const order = await orderService.getDetailMine(id);
    if (!order) return null;
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
    };
  },

  /** Chi tiết đơn (FDD 5.2.3). `null` khi không có đơn hoặc đơn không thuộc người đang đăng nhập. */
  async getDetailMine(id: string): Promise<MyOrderDetail | null> {
    try {
      return toDetail(await apiFetch<RawOrderDetail>(`/api/orders/${encodeURIComponent(id)}`));
    } catch (err) {
      if (isMissing(err)) return null;
      throw err;
    }
  },

  /** Đơn của tôi, mới nhất trước; lọc theo trạng thái nếu có (FDD 5.2.1–5.2.2). */
  async listMine(status?: OrderStatus): Promise<MyOrderListItem[]> {
    const page = await apiFetch<Paginated<RawListItem>>(`/api/orders${toQueryString({ status, limit: LIST_LIMIT })}`);
    return page.items.map((o) => ({ ...o, total: Number(o.total) }));
  },

  /** Huỷ đơn (FDD 5.2.5). Điều kiện huỷ do `canCancel` kiểm trước; backend kiểm lại (chỉ đơn `pending`). */
  async cancel(id: string): Promise<void> {
    await apiFetch(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: "PUT" });
  },
};
