// FDD 8.1 — Bố cục màn Tổng quan (design/admin/01 §1). Server Component.
import { Alert, Col, Row } from "antd";
import type { AdminOrderListItem } from "@/entities/order";
import type { OverviewStats, RevenuePoint } from "@/entities/statistics";
import { LatestOrdersTable } from "./LatestOrdersTable";
import { OrderStatusBreakdown } from "./OrderStatusBreakdown";
import { RevenueChart } from "./RevenueChart";
import { StatCards } from "./StatCards";
import styles from "./dashboard.module.css";

export interface DashboardViewProps {
  overview: OverviewStats;
  revenue: readonly RevenuePoint[];
  year: number;
  latestOrders: AdminOrderListItem[];
}

export function DashboardView({ overview, revenue, year, latestOrders }: Readonly<DashboardViewProps>) {
  return (
    <div className={styles.page}>
      {(overview.unavailable?.length ?? 0) > 0 && (
        <Alert type="warning" showIcon title="Một số số liệu tạm thời chưa lấy được" />
      )}
      <StatCards overview={overview} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <RevenueChart items={revenue} year={year} />
        </Col>
        <Col xs={24} lg={8}>
          <OrderStatusBreakdown items={overview.orders_by_status} />
        </Col>
      </Row>
      <LatestOrdersTable orders={latestOrders} />
    </div>
  );
}
