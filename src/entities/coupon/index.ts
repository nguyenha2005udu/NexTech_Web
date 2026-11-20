// Chỉ export type + hằng (dùng được ở client). Service ở server: import từ "@/entities/coupon/admin-service".
export type { AdminCoupon, AdminCouponQuery, CouponCategory, CouponDiscountType, CouponStatus } from "./types";
export { COUPON_CATEGORY_LABEL, COUPON_STATUS_META, couponDisplayStatus } from "./status";
export type { CouponDisplayStatus } from "./status";
