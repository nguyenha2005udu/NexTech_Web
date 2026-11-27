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

/** Một dòng đơn khi đặt hàng (FDD 5.1.1). Chỉ gửi sản phẩm + số lượng: giá, phí ship, giảm giá do BACKEND tính. */
export interface CreateOrderLine {
  product_id: string;
  quantity: number;
}

/** Đầu vào tạo đơn của người mua. Web đẩy các dòng này vào giỏ của backend rồi đặt đúng các dòng đó. */
export interface CreateOrderInput {
  items: CreateOrderLine[];
  address_id: string;
  /** Mã giảm đơn (category `order`) */
  discount_code: string | null;
  /** Mã miễn phí vận chuyển (category `free_shipping`) — backend nhận ở ô riêng */
  freeship_code: string | null;
  payment_method: PaymentMethod;
}

/** Kết quả tạo đơn. `checkout_url` là trang thanh toán PayOS (COD: `null`). */
export interface CreatedOrder {
  id: string;
  status: OrderStatus;
  total: number;
  payment_method: PaymentMethod;
  /** Id giao dịch vừa tạo; `null` khi chưa tạo được (đơn còn `processing`, hoặc backend lỗi lúc tạo thanh toán). */
  payment_id: string | null;
  /** Link thanh toán PayOS; `null` với COD, hoặc khi chưa tạo được link (xem trang kết quả để thử lại). */
  checkout_url: string | null;
}

/** Trạng thái đơn của chính người mua, dùng cho trang kết quả thanh toán (FDD 5.1.2). */
export interface MyOrderSummary {
  id: string;
  status: OrderStatus;
  total: number;
  /**
   * Backend chưa trả phương thức thanh toán ở API đơn hàng của người mua (chỉ có ở bản ghi thanh toán) nên thường là
   * `null`. Trang kết quả nhận gợi ý `method` từ URL sau khi đặt (chỉ để hiển thị, không dùng quyết định trạng thái).
   */
  payment_method: PaymentMethod | null;
  /** Suy ra từ trạng thái đơn: paid/shipped → success; cancelled/failed → failed; còn lại → pending. */
  payment_status: PaymentStatus | null;
}

/** Một dòng sản phẩm trong đơn của người mua (snapshot lúc đặt). */
export interface MyOrderItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

/** Một dòng của danh sách đơn của người mua (`GET /api/orders`) — gọn hơn chi tiết. */
export interface MyOrderListItem {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  item_count: number;
  product_name: string | null;
  product_image: string | null;
}

/** Chi tiết đơn của chính người mua (FDD 5.2.3). */
export interface MyOrderDetail extends MyOrderSummary {
  created_at: string;
  items: MyOrderItem[];
  /** Snapshot địa chỉ giao lúc đặt */
  shipping: { recipient_name: string; phone_number: string; full_address: string } | null;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  discount_code: string | null;
}
