import type { MyOrderSummary } from "@/entities/order";
import { paymentResultOf } from "./payment-result";

const order = (override: Partial<MyOrderSummary>): MyOrderSummary => ({
  id: "o-1",
  status: "pending",
  total: 1,
  payment_method: "payos",
  payment_status: "pending",
  ...override,
});

describe("paymentResultOf", () => {
  it("COD vừa đặt → 'Đã đặt hàng' (03.08)", () => {
    expect(paymentResultOf(order({ payment_method: "cod", payment_status: null }))).toBe("cod_placed");
  });

  it("COD đang giao vẫn là 'Đã đặt hàng'", () => {
    expect(paymentResultOf(order({ payment_method: "cod", status: "shipped", payment_status: null }))).toBe("cod_placed");
  });

  it.each([
    ["giao dịch thành công", { payment_status: "success" as const }],
    ["đơn đã thanh toán", { status: "paid" as const, payment_status: null }],
    ["thanh toán giả lập", { status: "simulated_success" as const }],
  ])("PayOS %s → 'Thanh toán thành công' (03.09)", (_label, override) => {
    expect(paymentResultOf(order(override))).toBe("paid");
  });

  it.each([
    ["đang tạo đơn", { status: "processing" as const }],
    ["chờ xử lý, giao dịch chờ", { status: "pending" as const, payment_status: "pending" as const }],
    ["chưa có bản ghi thanh toán", { payment_status: null }],
  ])("PayOS %s → 'Đang xác nhận thanh toán' (03.10)", (_label, override) => {
    expect(paymentResultOf(order(override))).toBe("pending");
  });

  it.each([
    ["đơn bị huỷ", { status: "cancelled" as const }],
    ["đơn thất bại", { status: "failed" as const }],
    ["giao dịch thất bại", { payment_status: "failed" as const }],
    ["COD bị huỷ", { payment_method: "cod" as const, status: "cancelled" as const, payment_status: null }],
  ])("%s → 'Thanh toán chưa hoàn tất' (03.11)", (_label, override) => {
    expect(paymentResultOf(order(override))).toBe("failed");
  });
});
