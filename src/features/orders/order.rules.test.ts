import { ORDER_FILTER_STATUSES, canCancel, parseStatusFilter } from "./order.rules";

describe("canCancel", () => {
  it("huỷ được khi đơn còn chờ xử lý và chưa thu tiền", () => {
    expect(canCancel({ status: "pending", payment_status: null })).toBe(true);
    expect(canCancel({ status: "pending", payment_status: "pending" })).toBe(true);
  });

  it("không huỷ được khi đã có giao dịch thanh toán thành công", () => {
    expect(canCancel({ status: "pending", payment_status: "success" })).toBe(false);
  });

  it.each(["paid", "shipped", "cancelled", "failed", "processing"] as const)(
    "không huỷ được đơn ở trạng thái %s",
    (status) => {
      expect(canCancel({ status, payment_status: null })).toBe(false);
    },
  );
});

describe("parseStatusFilter", () => {
  it.each(ORDER_FILTER_STATUSES)("nhận trạng thái hợp lệ %s", (status) => {
    expect(parseStatusFilter(status)).toBe(status);
  });

  it("lấy giá trị đầu khi tham số lặp", () => {
    expect(parseStatusFilter(["shipped", "paid"])).toBe("shipped");
  });

  it.each([undefined, "", "abc", "failed"])("giá trị %p về 'Tất cả'", (raw) => {
    expect(parseStatusFilter(raw)).toBeUndefined();
  });
});
