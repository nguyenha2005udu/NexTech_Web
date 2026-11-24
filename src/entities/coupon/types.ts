// Mã giảm giá — design/admin/05 §3–4. Backend gọi là *discount code* (promotion-service), web gọi là *coupon*.
export type CouponCategory = "order" | "free_shipping";
export type CouponDiscountType = "percent" | "fixed_amount";
/** `status` do backend tính: `paused` khi tắt tay, chưa tới `valid_from` hoặc đã quá `valid_until`. */
export type CouponStatus = "running" | "paused";

/** Một dòng của `GET /api/admin/discount-codes` (cột tiền đã đổi sang number ở service). */
export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  category: CouponCategory;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  status: CouponStatus;
}

export interface AdminCouponQuery {
  search?: string;
  category?: CouponCategory;
  status?: CouponStatus;
  page?: number;
  limit?: number;
}

/** Mã giảm giá người mua thấy ở checkout (FDD 4.2.2) — tập con của AdminCoupon, không có số liệu quản trị. */
export type Coupon = Pick<
  AdminCoupon,
  | "code"
  | "description"
  | "category"
  | "discount_type"
  | "discount_value"
  | "min_order_value"
  | "max_discount"
  | "valid_from"
  | "valid_until"
  | "is_active"
>;
