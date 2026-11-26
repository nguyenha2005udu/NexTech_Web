// Chỉ export type + hằng (dùng được ở client). Service ở server: "@/entities/coupon/admin-service" (quản trị),
// "@/entities/coupon/service" (người mua).
export type {
  AdminCoupon,
  AdminCouponQuery,
  Coupon,
  CouponCategory,
  CouponDiscountType,
  CouponStatus,
} from "./types";
export { COUPON_CATEGORY_LABEL, COUPON_STATUS_META, couponDisplayStatus } from "./status";
export type { CouponDisplayStatus } from "./status";
