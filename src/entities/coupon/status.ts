// Nhãn trạng thái hiển thị của mã giảm giá — tách từ `is_active` + ngày (design/admin/05 §1.3, ✅Q-CP1).
import type { AdminCoupon } from "./types";

export type CouponDisplayStatus = "running" | "paused" | "expired" | "scheduled";

export const COUPON_STATUS_META: Record<CouponDisplayStatus, { label: string; color: string }> = {
  running: { label: "Đang chạy", color: "green" },
  paused: { label: "Tạm dừng", color: "default" },
  expired: { label: "Hết hạn", color: "red" },
  scheduled: { label: "Chưa bắt đầu", color: "blue" },
};

/** Xét theo thứ tự: tắt tay → Tạm dừng; quá hạn → Hết hạn; chưa tới ngày bắt đầu → Chưa bắt đầu; còn lại → Đang chạy. */
export function couponDisplayStatus(
  coupon: Pick<AdminCoupon, "is_active" | "valid_from" | "valid_until">,
  now: Date,
): CouponDisplayStatus {
  if (!coupon.is_active) return "paused";
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return "expired";
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return "scheduled";
  return "running";
}

export const COUPON_CATEGORY_LABEL: Record<AdminCoupon["category"], string> = {
  order: "Đơn hàng",
  free_shipping: "Phí vận chuyển",
};
