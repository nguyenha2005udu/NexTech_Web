// FDD 5.2.1 — Danh sách đơn của tôi (Figma 04.05). Server Component.
import Link from "next/link";
import { Tag } from "antd";
import { routes } from "@/config/routes";
import { orderStatusMeta, type MyOrderDetail } from "@/entities/order";
import { formatDate, formatOrderCode, formatVND } from "@/lib/format";
import styles from "./Orders.module.css";

export function OrderList({ orders, filtered }: { orders: MyOrderDetail[]; filtered: boolean }) {
  if (!orders.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.strong}>{filtered ? "Không có đơn hàng nào ở trạng thái này." : "Bạn chưa có đơn hàng nào."}</p>
        <p className={styles.muted}>
          <Link href={routes.home} className={styles.link}>
            Tiếp tục mua sắm
          </Link>
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {orders.map((o) => {
        const meta = orderStatusMeta(o.status);
        const first = o.items[0]?.name ?? "Đơn hàng";
        const more = o.items.length - 1;
        return (
          <li key={o.id} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.code}>{formatOrderCode(o.id)}</span>
              <Tag color={meta.color}>{meta.label}</Tag>
            </div>
            <p className={styles.muted}>
              {first}
              {more > 0 ? ` và ${more} sản phẩm khác` : ""} · {formatDate(o.created_at)}
            </p>
            <div className={styles.cardFoot}>
              <span className={styles.total}>{formatVND(o.total)}</span>
              <Link href={routes.orderDetail(o.id)} className={styles.link}>
                Xem chi tiết
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
