// Đơn hàng — design/admin/04 §4. Enum `status` lệch giữa `be/` và order-service nên khai báo đủ cả hai
// (order-service 2026-11-20 đã bỏ `simulated_success`, chỉ còn 6 giá trị đầu).
import type { PaymentMethod, PaymentStatus } from "@/entities/transaction";

export type OrderStatus = "processing" | "pending" | "paid" | "shipped" | "cancelled" | "failed" | "simulated_success";

/** Một dòng của `GET /api/admin/orders` (tiền đã đổi sang number ở service). */
export interface AdminOrderListItem {
  id: string;
  /** `null` khi đơn không có snapshot tên người mua. */
  user_name: string | null;
  /** BE-3 — chưa có trong response; có thì bảng hiện thêm dòng email. */
  user_email?: string | null;
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

/** Giao dịch gắn với đơn (order-service trả cả bản ghi `payments`; web chỉ đọc các trường dưới). */
export interface AdminOrderPayment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paid_at: string | null;
}

export interface AdminOrderLine {
  product: { id: string; name: string; price: number };
  quantity: number;
  /** BE-4 — chưa có trong response. */
  product_image?: string | null;
}

/** `GET /api/admin/orders/:id` (tiền đã đổi sang number ở service). */
export interface AdminOrderDetail {
  id: string;
  /** Snapshot người mua lúc đặt (order-service không JOIN identity). */
  user: { id: string; full_name: string | null; email: string | null; phone_number: string | null };
  /** BE-4 — 3 trường người nhận chưa có trong response. */
  shipping_recipient_name?: string | null;
  shipping_phone_number?: string | null;
  shipping_full_address?: string | null;
  items: AdminOrderLine[];
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total: number;
  status: OrderStatus;
  note: string | null;
  payment: AdminOrderPayment | null;
  created_at: string;
}

/** Một dòng đơn gửi backend khi đặt hàng (FDD 5.1.1). Giá do SERVER điền từ dữ liệu sản phẩm, không lấy từ client. */
export interface CreateOrderLine {
  product_id: string;
  quantity: number;
  unit_price: number;
}

/** Body tạo đơn của người mua. Tổng tiền đã được server web tính lại (mục 5) — backend vẫn kiểm lần nữa. */
export interface CreateOrderInput {
  items: CreateOrderLine[];
  address_id: string;
  discount_code: string | null;
  payment_method: PaymentMethod;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total: number;
}

/** Kết quả tạo đơn. `checkout_url` là trang thanh toán PayOS (COD: `null`). */
export interface CreatedOrder {
  id: string;
  status: OrderStatus;
  total: number;
  payment_method: PaymentMethod;
  checkout_url: string | null;
}
