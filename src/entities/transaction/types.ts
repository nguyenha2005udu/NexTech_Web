// Giao dịch thanh toán — design/admin/06 §4. Khớp `payments` của order-service (`method`, `status`).
export type PaymentMethod = "cod" | "payos";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
