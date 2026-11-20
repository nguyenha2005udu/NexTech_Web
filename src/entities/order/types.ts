// Đơn hàng — design/admin/04 §4. Enum `status` lệch giữa `be/` và order-service nên khai báo đủ cả hai.
export type OrderStatus = "processing" | "pending" | "paid" | "shipped" | "cancelled" | "failed" | "simulated_success";

/** Một dòng của `GET /api/admin/orders`. */
export interface AdminOrderListItem {
  id: string;
  /** `null` khi tài khoản đã bị xoá (`be/`: `o.user?.full_name ?? null`). */
  user_name: string | null;
  product_count: number;
  total: number;
  status: OrderStatus;
  created_at: string;
}

export interface AdminOrderListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  from?: string;
  to?: string;
}
