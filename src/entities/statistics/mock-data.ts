// Dữ liệu mẫu cho test (khớp mockup design/admin/assets/01-dashboard.png).
import type { OverviewStats, RevenuePoint } from "./types";

export const mockOverview: OverviewStats = {
  total_orders: 1240,
  total_revenue: 2_450_000_000,
  total_products: 18,
  active_products: 16,
  total_users: 8320,
  orders_by_status: [
    { status: "pending", count: 223 },
    { status: "paid", count: 521 },
    { status: "shipped", count: 310 },
    { status: "cancelled", count: 99 },
    { status: "processing", count: 0 },
  ],
  unavailable: [],
};

const MONTHLY_REVENUE = [92, 128, 114, 160, 143, 185, 172, 196, 180, 147, 168, 198];

export function mockRevenueItems(year: number): RevenuePoint[] {
  return MONTHLY_REVENUE.map((millions, i) => ({
    period: `${year}-${String(i + 1).padStart(2, "0")}-01`,
    revenue: millions * 1_000_000,
    order_count: Math.round(millions / 1.8),
  }));
}
