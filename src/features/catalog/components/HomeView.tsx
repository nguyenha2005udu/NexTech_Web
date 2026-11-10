import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { routes } from "@/config/routes";
import type { Category } from "@/entities/category";
import type { Product } from "@/entities/product";
import { HomeHero } from "./HomeHero";
import { CategoryGrid, CommitmentStrip } from "./HomeSections";
import { ProductGrid } from "./ProductGrid";
import styles from "./Home.module.css";

type Props = { categories: Category[]; featured: Product[] };

// FDD 2.1 — Trang chủ (Figma 01.01)
export function HomeView({ categories, featured }: Props) {
  const exploreHref = categories[0] ? routes.category(categories[0].slug) : routes.search;
  return (
    <main>
      <HomeHero exploreHref={exploreHref} />
      <div className={styles.container}>
        <CommitmentStrip />
        <section id="danh-muc" className={styles.section} aria-labelledby="featured-categories">
          <SectionHeading id="featured-categories">Danh mục nổi bật</SectionHeading>
          <CategoryGrid categories={categories} />
        </section>
        <section className={styles.sectionLast} aria-labelledby="featured-products">
          <SectionHeading
            id="featured-products"
            action={
              <Link href={routes.search} className={styles.seeAll}>
                Xem tất cả <ArrowRightIcon />
              </Link>
            }
          >
            Sản phẩm nổi bật
          </SectionHeading>
          <div className={styles.gridSpacer}>
            <ProductGrid products={featured} columns={4} />
          </div>
        </section>
      </div>
    </main>
  );
}
