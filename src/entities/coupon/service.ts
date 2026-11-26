import "server-only";
import { apiFetch } from "@/lib/api/http";
import type { Paginated } from "@/types/api";
import type { Coupon, CouponCategory, CouponDiscountType } from "./types";

// FDD 4.2.2 — Mã giảm giá phía người mua, nối promotion-service qua API Gateway (công khai). Điều kiện dùng mã
// (hạn, đơn tối thiểu) hiển thị ở features/checkout/pricing.ts; backend kiểm lại khi đặt đơn.

const LIST_LIMIT = 100;

interface RawCode {
  code: string;
  description: string | null;
  category: CouponCategory;
  discount_type: CouponDiscountType;
  discount_value: string | number;
  min_order_value: string | number | null;
  max_discount: string | number | null;
  valid_until: string | null;
}

type RawValidate =
  | { is_valid: true; code: string; category: CouponCategory; discount_amount: number }
  | { is_valid: false; code: string; message: string };

export type CouponCheck =
  | { valid: true; code: string; category: CouponCategory; discountAmount: number }
  | { valid: false; message: string };

const toNumber = (v: string | number | null) => (v === null ? null : Number(v));

// Backend chỉ trả mã đang dùng được, nên `is_active` luôn true; danh sách không có `valid_from`.
const toCoupon = (raw: RawCode): Coupon => ({
  code: raw.code,
  description: raw.description,
  category: raw.category,
  discount_type: raw.discount_type,
  discount_value: Number(raw.discount_value),
  min_order_value: toNumber(raw.min_order_value),
  max_discount: toNumber(raw.max_discount),
  valid_from: null,
  valid_until: raw.valid_until,
  is_active: true,
});

export const couponService = {
  /** Mã đang dùng được để gợi ý trong hộp "Chọn mã giảm giá" (Figma 03.06): mã giảm đơn + mã miễn phí vận chuyển. */
  async listAvailable(): Promise<Coupon[]> {
    const [orderCodes, freeship] = await Promise.all([
      apiFetch<Paginated<RawCode>>(`/api/discount-codes?limit=${LIST_LIMIT}`),
      apiFetch<Paginated<RawCode>>(`/api/discount-codes/freeship?limit=${LIST_LIMIT}`),
    ]);
    return [...orderCodes.items, ...freeship.items].map(toCoupon);
  },

  /**
   * Thử mã với tạm tính / phí ship hiện tại, không trừ lượt dùng. Mã sai vẫn là HTTP 200 với `is_valid: false`.
   * Backend phân biệt mã giảm đơn và mã freeship: `category` cho biết gửi mã vào ô nào khi đặt đơn.
   */
  async validate(code: string, orderValue: number, shippingFee: number): Promise<CouponCheck> {
    const res = await apiFetch<RawValidate>("/api/discount-codes/validate", {
      method: "POST",
      body: { code: code.trim(), order_value: orderValue, shipping_fee: shippingFee },
    });
    return res.is_valid
      ? { valid: true, code: res.code, category: res.category, discountAmount: res.discount_amount }
      : { valid: false, message: res.message };
  },
};
