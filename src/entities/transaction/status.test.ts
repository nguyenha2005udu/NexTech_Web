import { isPaymentMethod, isPaymentStatus, paymentMethodMeta, paymentStatusMeta } from "./status";

describe("transaction status", () => {
  it("failed hiện 'Đã huỷ' xám (✅Q-T4)", () => {
    expect(paymentStatusMeta("failed")).toEqual({ label: "Đã huỷ", color: "default" });
  });

  it("trạng thái lạ → 'Không xác định'", () => {
    expect(paymentStatusMeta("expired")).toEqual({ label: "Không xác định", color: "default" });
    expect(isPaymentStatus("expired")).toBe(false);
  });

  it("phương thức lạ → hiện nguyên giá trị", () => {
    expect(paymentMethodMeta("momo")).toEqual({ label: "momo", color: "default", longLabel: "momo" });
    expect(paymentMethodMeta("payos").label).toBe("PayOS");
    expect(isPaymentMethod(1)).toBe(false);
  });
});
