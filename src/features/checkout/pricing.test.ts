import type { Coupon } from "@/entities/coupon";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, couponProblem, priceOrder, shippingFeeFor, subtotalOf } from "./pricing";

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
const cable = { price: 200_000, quantity: 1 };

describe("subtotalOf", () => {
  it("cộng giá × số lượng của mọi dòng", () => {
    expect(subtotalOf([laptop, { price: 1_990_000, quantity: 2 }])).toBe(18_970_000);
  });

  it("đơn rỗng có tạm tính 0", () => {
    expect(subtotalOf([])).toBe(0);
  });
});

describe("priceOrder", () => {
  it("đơn từ 500.000 ₫ miễn phí vận chuyển (BR-04): tổng = tạm tính", () => {
    expect(priceOrder([laptop], [], NOW)).toEqual({
      subtotal: 14_990_000,
      shippingFee: 0,
      discount: 0,
      total: 14_990_000,
      couponError: null,
    });
  });

  it("đơn dưới 500.000 ₫: tổng = tạm tính + 30.000 ₫ phí vận chuyển", () => {
    expect(priceOrder([cable], [], NOW)).toEqual({
      subtotal: 200_000,
      shippingFee: SHIPPING_FEE,
      discount: 0,
      total: 230_000,
      couponError: null,
    });
  });

  it("đơn rỗng không tính phí vận chuyển", () => {
    expect(priceOrder([], [], NOW)).toMatchObject({ shippingFee: 0, total: 0 });
  });

  it("mã giảm cố định trừ vào tổng (NEX200 trên laptop, đã miễn phí ship → 14.790.000 ₫)", () => {
    expect(priceOrder([laptop], [makeCoupon()], NOW)).toMatchObject({ discount: 200_000, total: 14_790_000 });
  });

  it("mã giảm % tính trên tạm tính, làm tròn xuống", () => {
    const coupon = makeCoupon({ discount_type: "percent", discount_value: 5 });
    expect(priceOrder([{ price: 999_999, quantity: 1 }], [coupon], NOW).discount).toBe(49_999);
  });

  it("mã giảm % không vượt mức giảm tối đa", () => {
    const coupon = makeCoupon({ discount_type: "percent", discount_value: 10, max_discount: 500_000 });
    expect(priceOrder([laptop], [coupon], NOW).discount).toBe(500_000);
  });

  it("mã giảm cố định không làm tạm tính âm", () => {
    const coupon = makeCoupon({ discount_value: 5_000_000 });
    expect(priceOrder([{ price: 1_000_000, quantity: 1 }], [coupon], NOW)).toMatchObject({
      discount: 1_000_000,
      total: 0,
    });
  });

  it("mã miễn phí vận chuyển chỉ giảm trên phí vận chuyển", () => {
    const coupon = makeCoupon({ code: "FREESHIP", category: "free_shipping", discount_type: "percent", discount_value: 100 });
    expect(priceOrder([cable], [coupon], NOW)).toMatchObject({ discount: SHIPPING_FEE, total: 200_000 });
  });

  it("đơn đã miễn phí ship thì mã freeship không giảm thêm", () => {
    const coupon = makeCoupon({ code: "FREESHIP", category: "free_shipping", discount_type: "percent", discount_value: 100 });
    expect(priceOrder([laptop], [coupon], NOW)).toMatchObject({ shippingFee: 0, discount: 0, total: 14_990_000 });
  });

  it("mã không đủ điều kiện thì không giảm và trả lý do", () => {
    const coupon = makeCoupon({ min_order_value: 20_000_000 });
    expect(priceOrder([laptop], [coupon], NOW)).toMatchObject({
      discount: 0,
      total: 14_990_000,
      couponError: "Đơn tối thiểu 20.000.000 ₫ để dùng mã NEX200",
    });
  });
});

describe("priceOrder — 2 loại mã", () => {
  it("cộng giảm đơn và giảm phí vận chuyển", () => {
    const freeship = makeCoupon({ code: "SHIP", category: "free_shipping", discount_type: "fixed_amount", discount_value: 30_000 });
    const order = { price: 300_000, quantity: 1 };
    expect(priceOrder([order], [makeCoupon(), freeship], NOW)).toMatchObject({
      shippingFee: SHIPPING_FEE,
      discount: 200_000 + SHIPPING_FEE,
      total: 300_000 + SHIPPING_FEE - 200_000 - SHIPPING_FEE,
      couponError: null,
    });
  });

  it("một mã lỗi thì không giảm gì và báo lỗi của mã đó", () => {
    const freeship = makeCoupon({ code: "SHIP", category: "free_shipping", min_order_value: 99_000_000 });
    expect(priceOrder([laptop], [makeCoupon(), freeship], NOW)).toMatchObject({ discount: 0, couponError: expect.stringContaining("SHIP") });
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

describe("shippingFeeFor — BR-04", () => {
  it("ngưỡng miễn phí khớp order-service: 500.000 ₫", () => {
    expect(FREE_SHIPPING_THRESHOLD).toBe(500_000);
    expect(SHIPPING_FEE).toBe(30_000);
  });

  it.each([
    [1, SHIPPING_FEE],
    [499_999, SHIPPING_FEE],
    [500_000, 0],
    [500_001, 0],
    [14_990_000, 0],
  ])("tạm tính %i ₫ → phí ship %i ₫ (ngưỡng tính từ tạm tính, bao gồm mốc 500.000)", (subtotal, fee) => {
    expect(shippingFeeFor(subtotal)).toBe(fee);
  });

  it("đơn rỗng không có phí", () => {
    expect(shippingFeeFor(0)).toBe(0);
  });

  it("ngưỡng tính trên tạm tính TRƯỚC giảm giá, không phải sau (như backend)", () => {
    const coupon = makeCoupon({ discount_value: 400_000 });
    expect(priceOrder([{ price: 600_000, quantity: 1 }], [coupon], NOW)).toMatchObject({ shippingFee: 0, total: 200_000 });
  });

  it("nhiều dòng cộng lại chạm ngưỡng thì miễn phí", () => {
    expect(priceOrder([{ price: 250_000, quantity: 1 }, { price: 125_000, quantity: 2 }], [], NOW).shippingFee).toBe(0);
  });
});
