import { ORDER_STATUS_OPTIONS, parseOrderListParams, parseOrderView } from "./order.rules";

const ID = "aaaaaaaa-0000-4000-8000-000000000001";

describe("parseOrderListParams", () => {
  it("URL rỗng → trang 1, 20 dòng, không lọc", () => {
    expect(parseOrderListParams({})).toEqual({ search: undefined, status: undefined, page: 1, limit: 20 });
  });

  it("đọc q (trim), status, page", () => {
    expect(parseOrderListParams({ q: "  Bình ", status: "paid", page: "3" })).toEqual({
      search: "Bình",
      status: "paid",
      page: 3,
      limit: 20,
    });
  });

  it("trạng thái backend không nhận (simulated_success, chữ lạ) bị bỏ", () => {
    expect(parseOrderListParams({ status: "simulated_success" }).status).toBeUndefined();
    expect(parseOrderListParams({ status: "delivered" }).status).toBeUndefined();
  });

  it("trạng thái saga (failed) vẫn lọc được qua URL", () => {
    expect(parseOrderListParams({ status: "failed" }).status).toBe("failed");
  });

  it("trang không hợp lệ → 1; tham số lặp lấy giá trị đầu; q cắt 100 ký tự", () => {
    expect(parseOrderListParams({ page: "-1" }).page).toBe(1);
    expect(parseOrderListParams({ page: "2.5" }).page).toBe(1);
    expect(parseOrderListParams({ page: ["2", "5"] }).page).toBe(2);
    expect(parseOrderListParams({ q: "a".repeat(150) }).search).toHaveLength(100);
    expect(parseOrderListParams({ q: "   " }).search).toBeUndefined();
  });
});

describe("parseOrderView", () => {
  it("UUID hợp lệ → id; thiếu / sai định dạng → null", () => {
    expect(parseOrderView({ view: ID })).toBe(ID);
    expect(parseOrderView({})).toBeNull();
    expect(parseOrderView({ view: "1 OR 1=1" })).toBeNull();
  });
});

describe("ORDER_STATUS_OPTIONS", () => {
  it("4 trạng thái của mockup theo đúng thứ tự", () => {
    expect(ORDER_STATUS_OPTIONS.map((o) => o.label)).toEqual(["Chờ xử lý", "Đã thanh toán", "Đang giao", "Đã huỷ"]);
  });
});
