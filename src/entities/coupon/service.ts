import "server-only";
import type { Coupon } from "./types";

// FDD 4.2.2 — Mã giảm giá phía người mua. Điều kiện dùng mã (hạn, đơn tối thiểu) kiểm ở
// features/checkout/pricing.ts để client hiển thị và server tính lại giống nhau.
// TODO(backend): thay mock bằng API promotion-service khi chốt hợp đồng phía người mua.
const mockCoupons: Coupon[] = [
  {
    code: "NEX200",
    description: "Giảm 200.000 ₫ cho đơn từ 10 triệu",
    category: "order",
    discount_type: "fixed_amount",
    discount_value: 200_000,
    min_order_value: 10_000_000,
    max_discount: null,
    valid_from: null,
    valid_until: null,
    is_active: true,
  },
  {
    code: "FREESHIP",
    description: "Miễn phí vận chuyển cho đơn từ 5 triệu",
    category: "free_shipping",
    discount_type: "percent",
    discount_value: 100,
    min_order_value: 5_000_000,
    max_discount: null,
    valid_from: null,
    valid_until: null,
    is_active: true,
  },
];

export const couponService = {
  /** Mã đang bật để gợi ý trong hộp "Chọn mã giảm giá" (Figma 03.06). */
  async listAvailable(): Promise<Coupon[]> {
    return mockCoupons.filter((c) => c.is_active);
  },

  /** Tra mã người dùng gõ tay; không phân biệt hoa thường. */
  async findByCode(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    return mockCoupons.find((c) => c.code === normalized) ?? null;
  },
};
