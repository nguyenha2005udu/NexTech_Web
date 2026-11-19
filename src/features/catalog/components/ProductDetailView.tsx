import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import type { Product } from "@/entities/product";
import { ProductDetailTabs } from "./ProductDetailTabs";
import { ProductGallery } from "./ProductGallery";
import { ProductOverview } from "./ProductOverview";
import styles from "./ProductDetail.module.css";

type Props = {
  product: Product;
  crumbs: Crumb[];
  /** Khối đánh giá — page ghép từ feature reviews (thường bọc <Suspense>) */
  reviews: ReactNode;
  /** Mua ngay / Thêm vào giỏ — page ghép từ feature cart (4.1.1) */
  purchase?: ReactNode;
  /** Theo dõi giá — page ghép từ feature price-alerts (6.1.1) */
  priceAlert?: ReactNode;
};

// FDD 2.3 — Chi tiết sản phẩm (Figma 01.05). catalog không import cart/price-alerts/reviews:
// page trong app/ ghép các feature đó qua slot (mục 3.4).
export function ProductDetailView({ product, crumbs, reviews, purchase, priceAlert }: Props) {
  return (
    <main className={styles.page}>
      <Breadcrumbs items={crumbs} />
      <div className={styles.stack}>
        <section className={styles.top} aria-label="Tổng quan sản phẩm">
          <ProductGallery images={product.images} />
          <ProductOverview product={product} purchase={purchase} priceAlert={priceAlert} />
        </section>
        <ProductDetailTabs
          specs={product.specs}
          description={product.description}
          reviewCount={product.reviewCount}
          reviews={reviews}
        />
      </div>
    </main>
  );
}
