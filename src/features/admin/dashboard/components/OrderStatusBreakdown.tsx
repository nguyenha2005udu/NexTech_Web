// FDD 8.1 — "Đơn theo trạng thái" (design/admin/01 §2.3).
import { Card, Progress } from "antd";
import type { OverviewStats } from "@/entities/statistics";
import { toStatusBreakdown } from "../status-breakdown";
import styles from "./dashboard.module.css";

export function OrderStatusBreakdown({ items }: Readonly<{ items: OverviewStats["orders_by_status"] }>) {
  const rows = toStatusBreakdown(items);

  return (
    <Card variant="borderless" className={styles.panel} title={<span className={styles.panelTitle}>Đơn theo trạng thái</span>}>
      <ul className={styles.statusList}>
        {rows.map((row) => (
          <li key={row.status}>
            <div className={styles.statusHead}>
              <span>{row.label}</span>
              <span className={styles.statusPercent}>{row.percent}%</span>
            </div>
            <Progress
              percent={row.percent}
              showInfo={false}
              strokeColor={row.barColor}
              railColor="#f0f0f0"
              size="small"
              aria-label={`${row.label}: ${row.percent}% (${row.count} đơn)`}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
