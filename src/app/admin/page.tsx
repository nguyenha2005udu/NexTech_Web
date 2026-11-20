// FDD 8.1 — Tổng quan: thống kê doanh thu, số lượng bán, tồn kho (design/admin/01). SSR.
import type { Metadata } from "next";
import { adminOrderService } from "@/entities/order/admin-service";
import { statisticsService } from "@/entities/statistics/service";
import { DashboardView, currentYearInVietnam } from "@/features/admin/dashboard";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function AdminDashboardPage() {
  await requirePermission("stats:read");

  const year = currentYearInVietnam();
  const [overview, revenue, latest] = await Promise.all([
    statisticsService.overview(),
    statisticsService.revenueByMonth(year),
    adminOrderService.list({ page: 1, limit: 5 }),
  ]);

  return <DashboardView overview={overview} revenue={revenue.items} year={year} latestOrders={latest.items} />;
}
