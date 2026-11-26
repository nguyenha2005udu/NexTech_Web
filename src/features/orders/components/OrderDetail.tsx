// FDD 5.2.3 + 5.2.5 — Chi tiết đơn (Figma 04.06 / 04.07). Server Component; nút huỷ chỉ hiện khi canCancel.
import type { ReactNode } from "react";
import Link from "next/link";
import { Tag } from "antd";
import { routes } from "@/config/routes";
import { orderStatusMeta, type MyOrderDetail } from "@/entities/order";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { formatDateTime, formatOrderCode, formatVND } from "@/lib/format";
import { canCancel } from "../order.rules";
import { CancelOrderButton } from "./CancelOrderButton";
import styles from "./Orders.module.css";

const METHOD_LABEL = { cod: "COD", payos: "PayOS / VietQR" } as const;

type Props = {
  order: MyOrderDetail;
  /** Hành động theo từng sản phẩm (key = product_id), ví dụ nút "Viết đánh giá" — page ghép từ feature reviews (5.2.4) */
  itemActions?: Record<string, ReactNode>;
};

export function OrderDetail({ order, itemActions }: Props) {
  const meta = orderStatusMeta(order.status);
  const code = formatOrderCode(order.id);

  return (
    <main className={styles.wrap}>
      <Breadcrumbs
        items={[
          { label: "Trang chủ", href: routes.home },
          { label: "Đơn hàng của tôi", href: routes.orderLookup },
          { label: code },
        ]}
      />
      <div className={styles.cardHead}>
        <div>
          <h1 className={styles.title}>Đơn hàng {code}</h1>
          <p className={styles.subtitle}>Đặt lúc {formatDateTime(order.created_at)}</p>
        </div>
        <Tag color={meta.color}>{meta.label}</Tag>
      </div>

      <div className={styles.detailLayout}>
        <section className={styles.section} aria-labelledby="items-title">
          <h2 id="items-title" className={styles.sectionTitle}>
            Sản phẩm
          </h2>
          <ul className={styles.items}>
            {order.items.map((i) => (
              <li key={i.product_id} className={styles.item}>
                <span>
                  {i.name} <span className={styles.muted}>× {i.quantity}</span>
                </span>
                <span className={styles.itemSide}>
                  {itemActions?.[i.product_id]}
                  <span className={styles.strong}>{formatVND(i.unit_price * i.quantity)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {order.shipping ? (
          <section className={styles.section} aria-labelledby="ship-title">
            <h2 id="ship-title" className={styles.sectionTitle}>
              Địa chỉ giao hàng
            </h2>
            <p className={styles.strong}>
              {order.shipping.recipient_name} · {order.shipping.phone_number}
            </p>
            <p className={styles.muted}>{order.shipping.full_address}</p>
          </section>
        ) : null}

        <section className={styles.section} aria-labelledby="pay-title">
          <h2 id="pay-title" className={styles.sectionTitle}>
            Thanh toán
          </h2>
          <p className={styles.muted}>Phương thức: {METHOD_LABEL[order.payment_method]}</p>
          <div className={styles.sumRow}>
            <span>Tạm tính</span>
            <span>{formatVND(order.subtotal)}</span>
          </div>
          <div className={styles.sumRow}>
            <span>Phí vận chuyển</span>
            <span>{formatVND(order.shipping_fee)}</span>
          </div>
          {order.discount_amount > 0 ? (
            <div className={styles.sumRow}>
              <span>Giảm giá{order.discount_code ? ` (${order.discount_code})` : ""}</span>
              <span>-{formatVND(order.discount_amount)}</span>
            </div>
          ) : null}
          <div className={`${styles.sumRow} ${styles.sumTotal}`}>
            <span>Tổng cộng</span>
            <span>{formatVND(order.total)}</span>
          </div>
        </section>
      </div>

      <div className={styles.actions}>
        {canCancel(order) ? <CancelOrderButton orderId={order.id} /> : null}
        <Link href={routes.orderLookup} className={styles.link}>
          ← Về danh sách đơn
        </Link>
      </div>
    </main>
  );
}
