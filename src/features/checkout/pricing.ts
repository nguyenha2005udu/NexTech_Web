// FDD 4.2.2 + 5.1.1 — Tính tiền đơn hàng. Logic thuần, dùng chung:
// - client (CheckoutView) để hiển thị "Tóm tắt đơn hàng" ngay khi đổi mã / địa chỉ,
// - server (placeOrder) để tính lại bằng giá thật — kết quả của server mới là số được dùng (mục 5).
import type { Coupon } from "@/entities/coupon";
import { formatVND } from "@/lib/format";

/** Phí vận chuyển cố định (Figma 03.04). TODO(backend): lấy theo địa chỉ khi có API vận chuyển. */
export const SHIPPING_FEE = 30_000;

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

export function priceOrder(lines: readonly PricingLine[], coupon: Coupon | null, now: Date): OrderPricing {
  const subtotal = subtotalOf(lines);
  const shippingFee = lines.length ? SHIPPING_FEE : 0;
  const couponError = coupon ? couponProblem(coupon, subtotal, now) : null;

  let discount = 0;
  if (coupon && !couponError) {
    // Mã "free_shipping" giảm trên phí vận chuyển, mã "order" giảm trên tạm tính.
    discount = discountOn(coupon, coupon.category === "free_shipping" ? shippingFee : subtotal);
  }

  return { subtotal, shippingFee, discount, total: subtotal + shippingFee - discount, couponError };
}
