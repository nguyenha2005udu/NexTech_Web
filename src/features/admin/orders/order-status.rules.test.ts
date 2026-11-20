import { adminNextStatuses, orderTimeline, statusChangeWarnings } from "./order-status.rules";

describe("adminNextStatuses", () => {
  it("pending + COD → giao hoặc huỷ", () => {
    expect(adminNextStatuses("pending", "cod")).toEqual(["shipped", "cancelled"]);
  });

  it("pending + PayOS (hoặc chưa có giao dịch) → chỉ huỷ", () => {
    expect(adminNextStatuses("pending", "payos")).toEqual(["cancelled"]);
    expect(adminNextStatuses("pending", null)).toEqual(["cancelled"]);
  });

  it("paid → giao hoặc huỷ, không phụ thuộc phương thức", () => {
    expect(adminNextStatuses("paid", "payos")).toEqual(["shipped", "cancelled"]);
    expect(adminNextStatuses("paid", null)).toEqual(["shipped", "cancelled"]);
  });

  it.each(["shipped", "cancelled", "processing", "failed", "simulated_success"] as const)(
    "%s → không còn bước nào",
    (status) => {
      expect(adminNextStatuses(status, "cod")).toEqual([]);
    },
  );
});

describe("statusChangeWarnings", () => {
  it("câu chung theo đúng mockup", () => {
    expect(statusChangeWarnings("paid", "shipped")).toEqual([
      'Đổi trạng thái sang "Đang giao"? Khách hàng sẽ nhận được thông báo.',
    ]);
  });

  it("paid → cancelled nhắc hoàn tiền thủ công", () => {
    expect(statusChangeWarnings("paid", "cancelled")).toEqual([
      'Đổi trạng thái sang "Đã huỷ"? Khách hàng sẽ nhận được thông báo.',
      "Đơn đã thanh toán — cần hoàn tiền thủ công cho khách.",
    ]);
  });

  it("pending → shipped (COD) nhắc ghi nhận đã thu tiền", () => {
    expect(statusChangeWarnings("pending", "shipped")[1]).toBe("Giao dịch COD sẽ được ghi nhận đã thu tiền.");
  });

  it("pending → cancelled chỉ có câu chung", () => {
    expect(statusChangeWarnings("pending", "cancelled")).toHaveLength(1);
  });
});

describe("orderTimeline", () => {
  const TITLES = ["Chờ xử lý", "Đã thanh toán", "Đang giao"];

  it("pending: đang ở bước 1", () => {
    expect(orderTimeline("pending", null)).toEqual({ current: 0, status: "process", titles: TITLES });
  });

  it("paid: qua bước 1, 2; bước 3 chờ", () => {
    expect(orderTimeline("paid", { method: "payos", status: "success" })).toEqual({
      current: 1,
      status: "finish",
      titles: TITLES,
    });
  });

  it("shipped PayOS: xong cả 3 bước", () => {
    expect(orderTimeline("shipped", { method: "payos", status: "success" })).toEqual({
      current: 2,
      status: "finish",
      titles: TITLES,
    });
  });

  it("shipped COD: bước 2 đổi nhãn 'Đã thu tiền'", () => {
    expect(orderTimeline("shipped", { method: "cod", status: "success" }).titles).toEqual([
      "Chờ xử lý",
      "Đã thu tiền",
      "Đang giao",
    ]);
  });

  it("huỷ khi chưa thanh toán: lỗi ở bước 2, nhãn 'Đã huỷ'", () => {
    expect(orderTimeline("cancelled", { method: "payos", status: "failed" })).toEqual({
      current: 1,
      status: "error",
      titles: ["Chờ xử lý", "Đã huỷ", "Đang giao"],
    });
  });

  it("huỷ sau khi đã thanh toán / hoàn tiền: lỗi ở bước 3", () => {
    for (const status of ["success", "refunded"] as const) {
      expect(orderTimeline("cancelled", { method: "payos", status })).toEqual({
        current: 2,
        status: "error",
        titles: ["Chờ xử lý", "Đã thanh toán", "Đã huỷ"],
      });
    }
  });

  it("failed: lỗi ở bước 1; processing: chờ ở bước 1 với nhãn trạng thái", () => {
    expect(orderTimeline("failed", null)).toMatchObject({ current: 0, status: "error", titles: ["Thất bại", "Đã thanh toán", "Đang giao"] });
    expect(orderTimeline("processing", null)).toMatchObject({ current: 0, status: "wait", titles: ["Đang tạo đơn", "Đã thanh toán", "Đang giao"] });
  });
});
