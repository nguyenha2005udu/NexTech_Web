import "server-only";

// FDD 8.1 — Lấy dữ liệu màn Tổng quan (design/admin/01 §3). Mỗi nguồn lỗi riêng: nguồn nào backend báo lỗi
// (404 chưa có API, 503 service sập…) thì thay bằng dữ liệu rỗng + đánh dấu, phần còn lại vẫn hiện.
// 2026-11-20: order-service chưa có `/api/admin/statistics/*` (thư mục admin-statistics rỗng) → 404 NT-GEN-0004.
import type { AdminOrderListItem } from "@/entities/order";
import { adminOrderService } from "@/entities/order/admin-service";
import type { OverviewStats, RevenuePoint } from "@/entities/statistics";
import { statisticsService } from "@/entities/statistics/service";
import { ApiError } from "@/lib/api/http";

export type DashboardSource = "overview" | "revenue" | "orders";

export interface DashboardData {
  overview: OverviewStats;
  revenue: RevenuePoint[];
  latestOrders: AdminOrderListItem[];
  /** Nguồn không lấy được (rỗng = đủ dữ liệu). */
  failed: DashboardSource[];
}

export const LATEST_ORDERS_LIMIT = 5;

const EMPTY_OVERVIEW: OverviewStats = {
  total_orders: null,
  total_revenue: null,
  total_products: null,
  active_products: null,
  total_users: null,
  orders_by_status: [],
};

/** Lỗi backend (ApiError) → `null`; lỗi khác (lập trình) ném tiếp để `error.tsx` bắt. */
async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (err) {
    if (err instanceof ApiError) return null;
    throw err;
  }
}

export async function loadDashboard(year: number): Promise<DashboardData> {
  const [overview, revenue, latest] = await Promise.all([
    orNull(statisticsService.overview()),
    orNull(statisticsService.revenueByMonth(year)),
    orNull(adminOrderService.list({ page: 1, limit: LATEST_ORDERS_LIMIT })),
  ]);

  const failed: DashboardSource[] = [];
  if (!overview) failed.push("overview");
  if (!revenue) failed.push("revenue");
  if (!latest) failed.push("orders");

  return {
    overview: overview ?? EMPTY_OVERVIEW,
    revenue: revenue?.items ?? [],
    latestOrders: latest?.items ?? [],
    failed,
  };
}
