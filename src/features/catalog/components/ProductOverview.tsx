import type { ReactNode } from "react";
import type { Product } from "@/entities/product";
import { formatVND } from "@/lib/format";
import { Rating } from "./Rating";
import styles from "./ProductDetail.module.css";

type Props = {
  product: Product;
  /** Khu vực mua hàng do page ghép từ feature cart (4.1.1) */
  purchase: ReactNode;
  /** Nút theo dõi giá do page ghép từ feature price-alerts (6.1.1) */
  priceAlert: ReactNode;
};

// FDD 2.3 — Khối thông tin bên phải (Figma 01.05)
export function ProductOverview({ product, purchase, priceAlert }: Props) {
  return (
    <div className={styles.overview}>
      <span className={product.inStock ? styles.stockIn : styles.stockOut}>{product.inStock ? "Còn hàng" : "Hết hàng"}</span>
      <h1 className={styles.name}>{product.name}</h1>
      <div className={styles.ratingRow}>
        <Rating value={product.rating} />
        <span className={styles.muted}>{product.reviewCount} đánh giá</span>
      </div>
      <p className={styles.headline}>{product.headline}</p>
      <p className={styles.price}>{formatVND(product.price)}</p>
      {purchase}
      <div>{priceAlert}</div>
    </div>
  );
}
