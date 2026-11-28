// FDD 6.1.2 — Danh sách cảnh báo giá của tôi. Server Component; nút xoá là Client Component lá.
import Link from "next/link";
import { Tag } from "antd";
import { routes } from "@/config/routes";
import type { PriceAlert } from "@/entities/price-alert";
import type { Product } from "@/entities/product";
import { formatDate, formatVND } from "@/lib/format";
import { RemovePriceAlertButton } from "./RemovePriceAlertButton";
import styles from "./PriceAlerts.module.css";

type Props = { alerts: PriceAlert[]; products: Product[] };

export function PriceAlertList({ alerts, products }: Props) {
  // Sản phẩm đã ngừng bán không còn trang để dẫn tới → ẩn khỏi danh sách (vẫn xoá được ở backend).
  const rows = alerts.flatMap((alert) => {
    const product = products.find((p) => p.id === alert.product_id);
    return product ? [{ alert, product }] : [];
  });

  if (!rows.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.strong}>Bạn chưa theo dõi giá sản phẩm nào.</p>
        <p className={styles.muted}>
          Mở một sản phẩm và bấm “Theo dõi giá” để đặt mức giá mong muốn.{" "}
          <Link href={routes.home} className={styles.link}>
            Khám phá sản phẩm
          </Link>
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {rows.map(({ alert, product }) => (
        <li key={alert.id} className={styles.card}>
          <div className={styles.info}>
            <Link href={routes.product(product.slug)} className={styles.name}>
              {product.name}
            </Link>
            <p className={styles.muted}>
              Giá hiện tại {formatVND(product.price)} · Đặt ngày {formatDate(alert.created_at)}
            </p>
            <p className={styles.muted}>
              Báo khi giá ≤ <span className={styles.target}>{formatVND(alert.target_price)}</span>
            </p>
          </div>
          <div className={styles.side}>
            {alert.status === "triggered" ? <Tag className={styles.triggered}>Đã chạm mục tiêu</Tag> : <Tag>Đang theo dõi</Tag>}
            <RemovePriceAlertButton alertId={alert.id} productName={product.name} />
          </div>
        </li>
      ))}
    </ul>
  );
}
