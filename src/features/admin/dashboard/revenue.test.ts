import type { RevenuePoint } from "@/entities/statistics";
import { currentYearInVietnam, toMonthlyBars } from "./revenue";

const point = (period: string, revenue: number, order_count = 1): RevenuePoint => ({ period, revenue, order_count });

describe("toMonthlyBars", () => {
  it("luôn trả đủ 12 tháng T1–T12", () => {
    const bars = toMonthlyBars([point("2026-03-01", 10)]);
    expect(bars).toHaveLength(12);
    expect(bars.map((b) => b.label)).toEqual(["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"]);
  });

  it("tháng không có dữ liệu có doanh thu và số đơn bằng 0", () => {
    const bars = toMonthlyBars([point("2026-07-01", 41_500_000, 23)]);
    expect(bars[0]).toMatchObject({ month: 1, revenue: 0, orderCount: 0, ratio: 0 });
    expect(bars[6]).toMatchObject({ month: 7, revenue: 41_500_000, orderCount: 23 });
  });

  it("tháng doanh thu lớn nhất có ratio = 1, tháng khác tỉ lệ theo nó", () => {
    const bars = toMonthlyBars([point("2026-01-01", 50), point("2026-02-01", 200), point("2026-03-01", 100)]);
    expect(bars[1]?.ratio).toBe(1);
    expect(bars[0]?.ratio).toBe(0.25);
    expect(bars[2]?.ratio).toBe(0.5);
  });

  it("mảng rỗng không chia cho 0 — mọi cột cao 0", () => {
    const bars = toMonthlyBars([]);
    expect(bars.every((b) => b.ratio === 0 && b.revenue === 0)).toBe(true);
  });

  it("không đổi thứ tự khi backend trả tháng lộn xộn", () => {
    const bars = toMonthlyBars([point("2026-12-01", 30), point("2026-02-01", 60)]);
    expect(bars[11]?.revenue).toBe(30);
    expect(bars[1]?.revenue).toBe(60);
  });
});

describe("currentYearInVietnam", () => {
  it("lấy năm theo giờ Việt Nam, không theo UTC", () => {
    // 31/12/2025 18:00 UTC = 01/01/2026 01:00 giờ VN
    expect(currentYearInVietnam(new Date("2025-12-31T18:00:00.000Z"))).toBe(2026);
    expect(currentYearInVietnam(new Date("2025-12-31T16:00:00.000Z"))).toBe(2025);
  });
});
