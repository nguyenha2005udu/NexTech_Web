import { Suspense, type ReactNode } from "react";
import type { FilterFacets } from "@/entities/product";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { FilterPanel } from "./FilterPanel";
import { ListingToolbar } from "./ListingToolbar";
import styles from "./Listing.module.css";

type Props = {
  crumbs: Crumb[];
  title: string;
  description?: string;
  facets: FilterFacets;
  children: ReactNode;
};

/** Khung trang danh sách: breadcrumb + tiêu đề + bộ lọc trái + kết quả (Figma 01.02–01.04). */
export function ListingView({ crumbs, title, description, facets, children }: Props) {
  return (
    <main className={styles.page}>
      <Breadcrumbs items={crumbs} />
      <div className={styles.heading}>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      <div className={styles.layout}>
        <Suspense fallback={<aside className={styles.sidebar} aria-busy="true" />}>
          <FilterPanel facets={facets} />
        </Suspense>
        <div className={styles.results}>
          <Suspense fallback={<div className={styles.toolbar} />}>
            <ListingToolbar />
          </Suspense>
          {children}
        </div>
      </div>
    </main>
  );
}
