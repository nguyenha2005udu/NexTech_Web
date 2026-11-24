import type { Coupon } from "@/entities/coupon";
import { SHIPPING_FEE, couponProblem, priceOrder, subtotalOf } from "./pricing";

const NOW = new Date("2026-11-24T10:00:00+07:00");

function makeCoupon(override: Partial<Coupon> = {}): Coupon {
  return {
    code: "NEX200",
    description: null,
    category: "order",
    discount_type: "fixed_amount",
    discount_value: 200_000,
    min_order_value: null,
    max_discount: null,
    valid_from: null,
    valid_until: null,
    is_active: true,
    ...override,
  };
}

const laptop = { price: 14_990_000, quantity: 1 };

describe("subtotalOf", () => {
  it("cộng giá × số lượng của mọi dòng", () => {
    expect(subtotalOf([laptop, { price: 1_990_000, quantity: 2 }])).toBe(18_970_000);
  });

  it("đơn rỗng có tạm tính 0", () => {
    expect(subtotalOf([])).toBe(0);
  });
});

describe("priceOrder", () => {
  it("không có mã: tổng = tạm tính + phí vận chuyển (Figma 03.04 không mã)", () => {
    expect(priceOrder([laptop], null, NOW)).toEqual({
      subtotal: 14_990_000,
      shippingFee: SHIPPING_FEE,
      discount: 0,
      total: 15_020_000,
      couponError: null,
    });
  });

  it("đơn rỗng không tính phí vận chuyển", () => {
    expect(priceOrder([], null, NOW)).toMatchObject({ shippingFee: 0, total: 0 });
  });

  it("mã giảm cố định trừ vào tổng (NEX200 → 14.820.000 ₫ như Figma 03.04)", () => {
    expect(priceOrder([laptop], makeCoupon(), NOW)).toMatchObject({ discount: 200_000, total: 14_820_000 });
  });

  it("mã giảm % tính trên tạm tính, làm tròn xuống", () => {
    const coupon = makeCoupon({ discount_type: "percent", discount_value: 5 });
    expect(priceOrder([{ price: 999_999, quantity: 1 }], coupon, NOW).discount).toBe(49_999);
  });

  it("mã giảm % không vượt mức giảm tối đa", () => {
    const coupon = makeCoupon({ discount_type: "percent", discount_value: 10, max_discount: 500_000 });
    expect(priceOrder([laptop], coupon, NOW).discount).toBe(500_000);
  });

  it("mã giảm cố định không làm tạm tính âm", () => {
    const coupon = makeCoupon({ discount_value: 5_000_000 });
    expect(priceOrder([{ price: 1_000_000, quantity: 1 }], coupon, NOW)).toMatchObject({
      discount: 1_000_000,
      total: SHIPPING_FEE,
    });
  });

  it("mã miễn phí vận chuyển chỉ giảm trên phí vận chuyển", () => {
    const coupon = makeCoupon({ code: "FREESHIP", category: "free_shipping", discount_type: "percent", discount_value: 100 });
    expect(priceOrder([laptop], coupon, NOW)).toMatchObject({ discount: SHIPPING_FEE, total: 14_990_000 });
  });

  it("mã không đủ điều kiện thì không giảm và trả lý do", () => {
    const coupon = makeCoupon({ min_order_value: 20_000_000 });
    expect(priceOrder([laptop], coupon, NOW)).toMatchObject({
      discount: 0,
      total: 15_020_000,
      couponError: "Đơn tối thiểu 20.000.000 ₫ để dùng mã NEX200",
    });
  });
});

describe("couponProblem", () => {
  it("mã hợp lệ trả null", () => {
    expect(couponProblem(makeCoupon({ min_order_value: 10_000_000 }), 10_000_000, NOW)).toBeNull();
  });

  it.each([
    ["đang tạm dừng", { is_active: false }, "Mã giảm giá đang tạm dừng"],
    ["đã hết hạn", { valid_until: "2026-11-23T23:59:59+07:00" }, "Mã giảm giá đã hết hạn"],
    ["chưa đến ngày", { valid_from: "2026-12-01T00:00:00+07:00" }, "Mã giảm giá chưa đến thời gian áp dụng"],
  ] as const)("báo lỗi khi mã %s", (_label, override, message) => {
    expect(couponProblem(makeCoupon(override), 50_000_000, NOW)).toBe(message);
  });

  it("còn trong hạn thì dùng được", () => {
    const coupon = makeCoupon({ valid_from: "2026-11-01T00:00:00+07:00", valid_until: "2026-11-30T23:59:59+07:00" });
    expect(couponProblem(coupon, 1, NOW)).toBeNull();
  });
});
