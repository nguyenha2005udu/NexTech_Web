// Nhãn + màu trạng thái đơn — dùng chung cho admin (bảng, dashboard) và trang đơn của khách (design/admin/04 §5).
import type { OrderStatus } from "./types";

export interface OrderStatusMeta {
  label: string;
  /** Màu preset của antd `Tag`. */
  color: string;
  /** Màu thanh `Progress` ở dashboard (mockup 01). */
  barColor: string;
}

/** Thứ tự khai báo = thứ tự hiển thị. 4 trạng thái đầu có trong mockup; ✅Q-D3: không có "Hoàn tất". */
export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: { label: "Chờ xử lý", color: "orange", barColor: "#faad14" },
  paid: { label: "Đã thanh toán", color: "blue", barColor: "#1677ff" },
  shipped: { label: "Đang giao", color: "cyan", barColor: "#13c2c2" },
  cancelled: { label: "Đã huỷ", color: "red", barColor: "#f5222d" },
  processing: { label: "Đang tạo đơn", color: "default", barColor: "#8c8c8c" },
  failed: { label: "Thất bại", color: "default", barColor: "#595959" },
  simulated_success: { label: "Đã thanh toán (giả lập)", color: "blue", barColor: "#69b1ff" },
};

/** 4 trạng thái chính luôn hiện ở dashboard, kể cả khi bằng 0. */
export const PRIMARY_ORDER_STATUSES: readonly OrderStatus[] = ["pending", "paid", "shipped", "cancelled"];

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[];

export function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_META;
}

/** Trạng thái lạ do backend trả → "Không xác định". */
export function orderStatusMeta(status: string): OrderStatusMeta {
  return isOrderStatus(status)
    ? ORDER_STATUS_META[status]
    : { label: "Không xác định", color: "default", barColor: "#bfbfbf" };
}
