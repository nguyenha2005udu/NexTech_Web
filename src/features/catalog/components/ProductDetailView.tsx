import type { ReactNode } from "react";
import { routes } from "@/config/routes";
import type { Category } from "@/entities/category";
import type { Product } from "@/entities/product";
import { Breadcrumbs } from "./Breadcrumbs";
import { ProductDetailTabs } from "./ProductDetailTabs";
import { ProductGallery } from "./ProductGallery";
import { ProductOverview } from "./ProductOverview";
import styles from "./ProductDetail.module.css";

type Props = {
  product: Product;
  category: Category | null;
  purchase: ReactNode;
  priceAlert: ReactNode;
  reviews: ReactNode;
};

// FDD 2.3 — Chi tiết sản phẩm (Figma 01.05). catalog không import cart/price-alerts/reviews:
// page trong app/ ghép các feature đó qua slot.
export function ProductDetailView({ product, category, purchase, priceAlert, reviews }: Props) {
  return (
    <main className={styles.page}>
      <Breadcrumbs
        items={[
          { label: "Trang chủ", href: routes.home },
          ...(category ? [{ label: category.name, href: routes.category(category.slug) }] : []),
          { label: product.name },
        ]}
      />
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
