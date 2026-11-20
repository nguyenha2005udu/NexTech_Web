// FDD 8.1 — 4 thẻ số liệu (design/admin/01 §2.1). Server Component; ✅Q-D1: không có dòng tăng trưởng.
import type { ComponentType, SVGProps } from "react";
import { Col, Row, Tooltip } from "antd";
import type { OverviewStats } from "@/entities/statistics";
import { ArchiveIcon, BanknoteIcon, ReceiptIcon, UsersIcon } from "@/components/ui/icons";
import { formatCompactVND, formatNumber } from "@/lib/format";
import styles from "./dashboard.module.css";

type Tone = "blue" | "green" | "purple" | "orange";

interface StatCardSpec {
  label: string;
  value: number | null;
  format: (n: number) => string;
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  tone: Tone;
}

function StatCard({ label, value, format, Icon, tone }: StatCardSpec) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statIcon} data-tone={tone}>
        <Icon size={22} />
      </span>
      <div>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>
          {value === null ? (
            <Tooltip title="Chưa lấy được dữ liệu">
              <span aria-label="Chưa lấy được dữ liệu">—</span>
            </Tooltip>
          ) : (
            format(value)
          )}
        </p>
      </div>
    </div>
  );
}

export function StatCards({ overview }: Readonly<{ overview: OverviewStats }>) {
  const cards: StatCardSpec[] = [
    { label: "Tổng đơn hàng", value: overview.total_orders, format: formatNumber, Icon: ReceiptIcon, tone: "blue" },
    { label: "Doanh thu", value: overview.total_revenue, format: formatCompactVND, Icon: BanknoteIcon, tone: "green" },
    { label: "Số sản phẩm", value: overview.total_products, format: formatNumber, Icon: ArchiveIcon, tone: "purple" },
    { label: "Người dùng", value: overview.total_users, format: formatNumber, Icon: UsersIcon, tone: "orange" },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.label} xs={24} sm={12} xl={6}>
          <StatCard {...card} />
        </Col>
      ))}
    </Row>
  );
}
