// FDD 8.1 — Biểu đồ "Doanh thu theo tháng" (design/admin/01 §2.2). Logic thuần.
import type { RevenuePoint } from "@/entities/statistics";

export interface MonthBar {
  month: number;
  label: string;
  revenue: number;
  orderCount: number;
  /** Chiều cao cột 0–1, tháng lớn nhất = 1. */
  ratio: number;
}

/** Lấp đủ T1–T12 (tháng thiếu = 0) và tính tỉ lệ chiều cao theo tháng lớn nhất. */
export function toMonthlyBars(items: readonly RevenuePoint[]): MonthBar[] {
  const byMonth = new Map<number, RevenuePoint>();
  for (const p of items) byMonth.set(Number(p.period.slice(5, 7)), p);

  const bars = Array.from({ length: 12 }, (_, i) => {
    const point = byMonth.get(i + 1);
    return { month: i + 1, label: `T${i + 1}`, revenue: point?.revenue ?? 0, orderCount: point?.order_count ?? 0 };
  });
  const max = Math.max(...bars.map((b) => b.revenue));
  return bars.map((b) => ({ ...b, ratio: max > 0 ? Math.max(b.revenue, 0) / max : 0 }));
}

const yearFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

/** Năm hiện tại theo giờ Việt Nam (✅Q-D5). */
export function currentYearInVietnam(now: Date = new Date()): number {
  return Number(yearFormatter.format(now));
}
