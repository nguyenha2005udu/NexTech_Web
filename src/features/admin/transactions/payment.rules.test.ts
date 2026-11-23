import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  canConfirmCod,
  orderViewHref,
  parsePaymentListParams,
  parsePaymentView,
} from "./payment.rules";

const UUID = "a1b2c3d4-0000-4000-8000-000000000001";

describe("canConfirmCod", () => {
  it("COD đang chờ → được xác nhận", () => {
    expect(canConfirmCod({ method: "cod", status: "pending" })).toBe(true);
  });

  it.each([
    ["cod", "success"],
    ["cod", "failed"],
    ["cod", "refunded"],
    ["payos", "pending"],
    ["payos", "success"],
  ] as const)("%s + %s → không được xác nhận", (method, status) => {
    expect(canConfirmCod({ method, status })).toBe(false);
  });
});

describe("parsePaymentListParams", () => {
  it("không có tham số → trang 1, 20 dòng, không lọc", () => {
    expect(parsePaymentListParams({})).toEqual({ method: undefined, status: undefined, page: 1, limit: 20 });
  });

  it("đọc method, status, page hợp lệ", () => {
    expect(parsePaymentListParams({ method: "cod", status: "pending", page: "3" })).toEqual({
      method: "cod",
      status: "pending",
      page: 3,
      limit: 20,
    });
  });

  it("giá trị lạ bị bỏ qua (backend sẽ trả 400)", () => {
    expect(parsePaymentListParams({ method: "visa", status: "paid", page: "-2" })).toEqual({
      method: undefined,
      status: undefined,
      page: 1,
      limit: 20,
    });
    expect(parsePaymentListParams({ page: "1.5" }).page).toBe(1);
  });

  it("tham số lặp lại → lấy giá trị đầu", () => {
    expect(parsePaymentListParams({ method: ["payos", "cod"] }).method).toBe("payos");
  });
});

describe("parsePaymentView", () => {
  it("UUID hợp lệ → trả id", () => {
    expect(parsePaymentView({ view: UUID })).toBe(UUID);
  });

  it.each([undefined, "", "PAY-A1B2C3D4", "../../orders"])("'%s' → null", (view) => {
    expect(parsePaymentView({ view })).toBeNull();
  });
});

describe("hằng & link", () => {
  it("options lọc đúng nhãn và thứ tự", () => {
    expect(PAYMENT_METHOD_OPTIONS).toEqual([
      { value: "payos", label: "PayOS" },
      { value: "cod", label: "COD" },
    ]);
    expect(PAYMENT_STATUS_OPTIONS.map((o) => o.label)).toEqual([
      "Thành công",
      "Chờ thanh toán",
      "Đã huỷ",
      "Đã hoàn tiền",
    ]);
  });

  it("orderViewHref → /admin/orders?view=<id>", () => {
    expect(orderViewHref(UUID)).toBe(`/admin/orders?view=${UUID}`);
  });
});
