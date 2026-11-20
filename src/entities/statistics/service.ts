import "server-only";
import { apiFetch } from "@/lib/api/http";
import type { OverviewStats, RevenueStats } from "./types";

// FDD 8.1 — Thống kê cửa hàng (design/admin/01 §4). Gateway yêu cầu vai trò admin.
export const statisticsService = {
  overview: () => apiFetch<OverviewStats>("/api/admin/statistics/overview"),

  /** Doanh thu theo tháng trong năm `year` (chỉ các tháng có dữ liệu). */
  revenueByMonth: (year: number) =>
    apiFetch<RevenueStats>(`/api/admin/statistics/revenue?groupBy=month&from=${year}-01-01&to=${year}-12-31`),
};
