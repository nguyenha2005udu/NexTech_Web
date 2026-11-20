// Nhãn + màu giao dịch — dùng chung cho màn Thanh toán và Drawer đơn hàng (design/admin/06 §4).
import type { PaymentMethod, PaymentStatus } from "./types";

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; color: string }> = {
  success: { label: "Thành công", color: "green" },
  pending: { label: "Chờ thanh toán", color: "orange" },
  failed: { label: "Đã huỷ", color: "default" }, // ✅Q-T4 — backend gọi là failed
  refunded: { label: "Đã hoàn tiền", color: "purple" },
};

export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; color: string; longLabel: string }> = {
  payos: { label: "PayOS", color: "blue", longLabel: "Chuyển khoản / PayOS" },
  cod: { label: "COD", color: "green", longLabel: "Thanh toán khi nhận hàng (COD)" },
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && value in PAYMENT_METHOD_META;
}
