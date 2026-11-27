import "server-only";
import { orderService } from "@/entities/order/service";
import type { MyOrderSummary } from "@/entities/order";
import type { PaymentMethod } from "@/entities/transaction";
import { readPaymentContext } from "./payment-context";

// FDD 5.1.2 — Dựng dữ liệu cho trang kết quả thanh toán từ BACKEND, không tin gì trên URL (mục 5, mục 15).
//
// URL về từ PayOS mang `orderCode` là MÃ SỐ của PayOS (không phải id đơn) cùng `status=PAID` / `cancel=true`.
// Những thứ đó chỉ là gợi ý và bị bỏ qua. Đơn nào, giao dịch nào lấy từ cookie lúc đặt hàng (payment-context.ts);
// trạng thái thật lấy từ backend: `GET /api/payments/:id/status` (backend hỏi lại PayOS) rồi `GET /api/orders/:id`.
// Backend kiểm đơn/giao dịch có thuộc người đang đăng nhập không, nên cookie bị sửa cũng không xem được đơn người khác.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PaymentResultParams {
  /** COD: id đơn do web tự tạo URL. PayOS: mã số của PayOS (bỏ qua). */
  orderCode?: string;
  /** Gợi ý phương thức trên URL; chỉ dùng khi không còn cookie */
  method?: string;
}

const asMethod = (value: string | undefined): PaymentMethod | null => (value === "cod" || value === "payos" ? value : null);

/** `null` khi không xác định được đơn, hoặc đơn không thuộc người đang đăng nhập. */
export async function loadPaymentResult(params: PaymentResultParams): Promise<MyOrderSummary | null> {
  const stored = await readPaymentContext();
  const orderCode = params.orderCode?.trim();
  const orderId = orderCode && UUID.test(orderCode) ? orderCode : stored?.orderId;
  if (!orderId) return null;

  // Cookie của đơn khác (đặt đơn mới sau đó) thì không dùng cho đơn này.
  const context = stored?.orderId === orderId ? stored : null;
  const method = context?.method ?? asMethod(params.method);

  // Hỏi giao dịch TRƯỚC khi đọc đơn: nếu PayOS đã báo PAID thì backend vừa đổi đơn sang `paid`.
  const paymentStatus = context?.paymentId && method === "payos" ? await orderService.getPaymentStatus(context.paymentId) : null;

  const order = await orderService.getMine(orderId);
  if (!order) return null;

  return {
    ...order,
    payment_method: method ?? order.payment_method,
    // `pending` không nói thêm gì so với trạng thái suy ra từ đơn
    payment_status: paymentStatus && paymentStatus !== "pending" ? paymentStatus : order.payment_status,
  };
}
