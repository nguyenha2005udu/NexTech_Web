// FDD 5.1.2 — Trang kết quả hiển thị trạng thái nào (Figma 03.08–03.11). Chỉ dựa trên dữ liệu đơn lấy từ
// backend, KHÔNG dựa vào ?status= / ?cancel= PayOS gắn lên returnUrl (mục 5, mục 15).
import type { MyOrderSummary } from "@/entities/order";

/** cod_placed 03.08 · paid 03.09 · pending 03.10 · failed 03.11 · processing: backend còn đang giữ hàng/xác nhận đơn (202) */
export type PaymentResultKind = "cod_placed" | "paid" | "pending" | "failed" | "processing";

export function paymentResultOf(order: Pick<MyOrderSummary, "status" | "payment_method" | "payment_status">): PaymentResultKind {
  if (order.status === "cancelled" || order.status === "failed" || order.payment_status === "failed") return "failed";
  // Đơn chưa qua saga (giữ kho, dùng mã): chưa nói được COD "đã đặt" hay PayOS "đang xác nhận".
  if (order.status === "processing") return "processing";
  if (order.payment_method === "cod") return "cod_placed";
  if (order.payment_status === "success" || order.status === "paid" || order.status === "simulated_success") {
    return "paid";
  }
  return "pending";
}
