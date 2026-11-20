// Thống kê cửa hàng — design/admin/01 §4–5.
import type { OrderStatus } from "@/entities/order";

/** `GET /api/admin/statistics/overview`. Trường = `null` khi service tương ứng sập (tên service nằm trong `unavailable`). */
export interface OverviewStats {
  total_orders: number | null;
  total_revenue: number | null;
  total_products: number | null;
  active_products: number | null;
  total_users: number | null;
  orders_by_status: Array<{ status: OrderStatus; count: number }>;
  /** Có ở spec order-service (NT.ORDER); monolith `be/` không trả trường này. */
  unavailable?: string[];
}

/** `period` dạng "YYYY-MM-DD" (ngày đầu kỳ). Backend chỉ trả kỳ có dữ liệu. */
export interface RevenuePoint {
  period: string;
  revenue: number;
  order_count: number;
}

/** `GET /api/admin/statistics/revenue`. */
export interface RevenueStats {
  group_by: "week" | "month";
  items: RevenuePoint[];
}
