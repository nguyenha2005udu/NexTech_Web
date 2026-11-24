// FDD 5.2.2 — Lọc đơn theo trạng thái (Figma 04.05). Bộ lọc nằm trên URL (?status=) nên chia sẻ/tải lại được.
import Link from "next/link";
import { routes } from "@/config/routes";
import { ORDER_STATUS_META } from "@/entities/order";
import { ORDER_FILTER_STATUSES, type OrderFilterStatus } from "../order.rules";
import styles from "./Orders.module.css";

export function OrderStatusFilter({ active }: { active: OrderFilterStatus | undefined }) {
  const tabs = [
    { label: "Tất cả", href: routes.orderLookup, isActive: !active },
    ...ORDER_FILTER_STATUSES.map((s) => ({
      label: ORDER_STATUS_META[s].label,
      href: routes.ordersByStatus(s),
      isActive: active === s,
    })),
  ];

  return (
    <nav aria-label="Lọc theo trạng thái" className={styles.tabs}>
      {tabs.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          aria-current={t.isActive ? "page" : undefined}
          className={`${styles.tab} ${t.isActive ? styles.tabActive : ""}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
