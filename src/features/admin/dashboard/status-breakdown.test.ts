import { toStatusBreakdown } from "./status-breakdown";

describe("toStatusBreakdown", () => {
  it("tính phần trăm làm tròn theo tổng số đơn", () => {
    const rows = toStatusBreakdown([
      { status: "pending", count: 18 },
      { status: "paid", count: 42 },
      { status: "shipped", count: 25 },
      { status: "cancelled", count: 15 },
    ]);
    expect(rows.map((r) => [r.label, r.percent])).toEqual([
      ["Chờ xử lý", 18],
      ["Đã thanh toán", 42],
      ["Đang giao", 25],
      ["Đã huỷ", 15],
    ]);
  });

  it("luôn hiện 4 trạng thái chính theo đúng thứ tự, kể cả khi backend không trả", () => {
    const rows = toStatusBreakdown([{ status: "cancelled", count: 1 }]);
    expect(rows.map((r) => r.status)).toEqual(["pending", "paid", "shipped", "cancelled"]);
    expect(rows[3]?.percent).toBe(100);
  });

  it("tổng bằng 0 thì mọi thanh 0%", () => {
    const rows = toStatusBreakdown([]);
    expect(rows.every((r) => r.percent === 0)).toBe(true);
  });

  it("không có dòng Hoàn tất", () => {
    const rows = toStatusBreakdown([{ status: "paid", count: 3 }]);
    expect(rows.some((r) => r.label === "Hoàn tất")).toBe(false);
  });

  it("trạng thái phụ chỉ hiện khi count > 0 và xếp sau 4 trạng thái chính", () => {
    const rows = toStatusBreakdown([
      { status: "processing", count: 0 },
      { status: "failed", count: 2 },
      { status: "paid", count: 8 },
    ]);
    expect(rows.map((r) => r.status)).toEqual(["pending", "paid", "shipped", "cancelled", "failed"]);
    expect(rows[4]).toMatchObject({ label: "Thất bại", percent: 20 });
  });

  it("trạng thái lạ có count > 0 hiện 'Không xác định' ở cuối", () => {
    const rows = toStatusBreakdown([
      { status: "delivered", count: 1 },
      { status: "paid", count: 1 },
    ]);
    expect(rows.at(-1)).toMatchObject({ status: "delivered", label: "Không xác định", percent: 50 });
  });
});
