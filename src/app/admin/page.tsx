// FDD 8.1 — Tổng quan: thống kê doanh thu, số lượng bán, tồn kho (design/admin/01). SSR.
import type { Metadata } from "next";
import { DashboardView, currentYearInVietnam, loadDashboard } from "@/features/admin/dashboard";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function AdminDashboardPage() {
  await requirePermission("stats:read");

  const year = currentYearInVietnam();
  const { overview, revenue, latestOrders, failed } = await loadDashboard(year);

  return (
    <DashboardView overview={overview} revenue={revenue} year={year} latestOrders={latestOrders} failed={failed} />
  );
}
