// FDD 8.1 — "Doanh thu theo tháng" (design/admin/01 §2.2). ✅Q-D2: cột vẽ bằng CSS, không thư viện chart.
import type { CSSProperties } from "react";
import { Card, Tooltip } from "antd";
import type { RevenuePoint } from "@/entities/statistics";
import { formatVND } from "@/lib/format";
import { toMonthlyBars } from "../revenue";
import styles from "./dashboard.module.css";

export function RevenueChart({ items, year }: Readonly<{ items: readonly RevenuePoint[]; year: number }>) {
  const bars = toMonthlyBars(items);
  const empty = bars.every((b) => b.revenue === 0);

  return (
    <Card variant="borderless" className={styles.panel} title={<span className={styles.panelTitle}>Doanh thu theo tháng</span>}>
      <ol className={styles.chart} aria-label={`Doanh thu theo tháng năm ${year}`}>
        {bars.map((bar) => (
          <li key={bar.month} className={styles.chartCol}>
            <div className={styles.chartTrack}>
              <Tooltip title={`Tháng ${bar.month}/${year} · ${formatVND(bar.revenue)} · ${bar.orderCount} đơn`}>
                <div
                  className={styles.chartBar}
                  style={{ "--ratio": bar.ratio } as CSSProperties}
                  role="img"
                  aria-label={`Tháng ${bar.month}: ${formatVND(bar.revenue)}`}
                />
              </Tooltip>
            </div>
            <span className={styles.chartLabel} aria-hidden="true">
              {bar.label}
            </span>
          </li>
        ))}
      </ol>
      {empty && <p className={styles.chartEmpty}>Chưa có doanh thu trong năm {year}</p>}
    </Card>
  );
}
