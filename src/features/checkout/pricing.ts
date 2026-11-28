// FDD 4.2.2 + 5.1.1 — Tính tiền đơn hàng. Logic thuần, dùng chung:
// - client (CheckoutView) để hiển thị "Tóm tắt đơn hàng" ngay khi đổi mã / địa chỉ,
// - server (placeOrder) để tính lại bằng giá thật — kết quả của server mới là số được dùng (mục 5).
import type { Coupon } from "@/entities/coupon";
import { formatVND } from "@/lib/format";

/**
 * Phí vận chuyển và ngưỡng miễn phí: khớp mặc định của order-service (SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, BR-04).
 * Chỉ để HIỂN THỊ trước khi đặt; số tiền thật do backend tính lúc đặt đơn. Backend đổi cấu hình thì sửa ở đây.
 * TODO(backend): lấy từ API cấu hình / theo địa chỉ khi có.
 */
export const SHIPPING_FEE = 30_000;
export const FREE_SHIPPING_THRESHOLD = 500_000;

/** BR-04: tạm tính (trước giảm giá) từ ngưỡng trở lên thì miễn phí vận chuyển; đơn rỗng không có phí. */
export function shippingFeeFor(subtotal: number): number {
  return subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export interface PricingLine {
  price: number;
  quantity: number;
}

export interface OrderPricing {
  subtotal: number;
  shippingFee: number;
  /** Tổng giảm (giảm trên đơn + giảm phí vận chuyển), luôn ≥ 0 */
  discount: number;
  total: number;
  /** Mã giảm giá không dùng được với đơn này → lý do để hiện cho người dùng; khi đó discount = 0 */
  couponError: string | null;
}

export function subtotalOf(lines: readonly PricingLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}

/** `null` nếu mã dùng được với đơn có tạm tính `subtotal` tại thời điểm `now`. */
export function couponProblem(coupon: Coupon, subtotal: number, now: Date): string | null {
  if (!coupon.is_active) return "Mã giảm giá đang tạm dừng";
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return "Mã giảm giá chưa đến thời gian áp dụng";
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return "Mã giảm giá đã hết hạn";
  if (coupon.min_order_value && subtotal < coupon.min_order_value) {
    return `Đơn tối thiểu ${formatVND(coupon.min_order_value)} để dùng mã ${coupon.code}`;
  }
  return null;
}

/** Số tiền giảm của mã trên một khoản `base` (tạm tính hoặc phí vận chuyển), không vượt quá `base`. */
function discountOn(coupon: Coupon, base: number): number {
  const raw =
    coupon.discount_type === "percent"
      ? Math.floor((base * coupon.discount_value) / 100)
      : coupon.discount_value;
  const capped = coupon.max_discount != null ? Math.min(raw, coupon.max_discount) : raw;
  return Math.max(0, Math.min(capped, base));
}

/** `coupons`: tối đa 1 mã giảm đơn + 1 mã freeship (backend cho dùng đồng thời); mã lỗi đầu tiên được báo. */
export function priceOrder(lines: readonly PricingLine[], coupons: readonly Coupon[], now: Date): OrderPricing {
  const subtotal = subtotalOf(lines);
  const shippingFee = lines.length ? shippingFeeFor(subtotal) : 0;
  const couponError = coupons.map((c) => couponProblem(c, subtotal, now)).find((p) => p !== null) ?? null;

  let discount = 0;
  if (!couponError) {
    // Mã "free_shipping" giảm trên phí vận chuyển, mã "order" giảm trên tạm tính.
    discount = coupons.reduce(
      (sum, c) => sum + discountOn(c, c.category === "free_shipping" ? shippingFee : subtotal),
      0,
    );
  }

  return { subtotal, shippingFee, discount, total: subtotal + shippingFee - discount, couponError };
}
