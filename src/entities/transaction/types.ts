// Giao dịch thanh toán — design/admin/06 §4. Khớp `payments` của order-service (`method`, `status`).
export type PaymentMethod = "cod" | "payos";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

/** Một dòng `GET /api/admin/payments` (tiền đã đổi sang number). Chưa có `created_at` (BE-5). */
export interface AdminPaymentListItem {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  /** `null` khi chưa thu tiền. */
  paid_at: string | null;
}

/** `GET /api/admin/payments/:id`. Không giữ `gateway_response` / sổ tiền về (design 06 §3.2: không hiện). */
export interface AdminPaymentDetail extends AdminPaymentListItem {
  /** Mã giao dịch PayOS; COD là `null`. */
  transaction_id: string | null;
  currency: string;
}

export interface AdminPaymentListQuery {
  method?: PaymentMethod;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}
