// FDD 8.2.2 — Tiến trình đơn hàng (design/admin/04 §2.3). Bảng ánh xạ ở `orderTimeline()`.
import { Steps } from "antd";
import type { AdminOrderPayment, OrderStatus } from "@/entities/order";
import { orderTimeline } from "../order-status.rules";
import styles from "./orders.module.css";

export interface OrderTimelineProps {
  status: OrderStatus;
  payment: Pick<AdminOrderPayment, "method" | "status"> | null;
}

export function OrderTimeline({ status, payment }: Readonly<OrderTimelineProps>) {
  const timeline = orderTimeline(status, payment);
  return (
    <Steps
      className={styles.timeline}
      size="small"
      titlePlacement="vertical"
      current={timeline.current}
      status={timeline.status}
      items={timeline.titles.map((title) => ({ title }))}
    />
  );
}
