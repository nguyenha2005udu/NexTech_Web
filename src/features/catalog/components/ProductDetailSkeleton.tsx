import styles from "./ProductDetail.module.css";

/** Khung chờ cùng bố cục với ProductDetailView — dùng trong products/[slug]/loading.tsx. */
export function ProductDetailSkeleton() {
  return (
    <main className={styles.page} aria-busy="true" aria-label="Đang tải sản phẩm">
      <div className={`${styles.skeletonBlock} ${styles.skeletonCrumb}`} />
      <div className={styles.stack}>
        <div className={styles.top}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonImage}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonOverview}`} />
        </div>
        <div className={`${styles.skeletonBlock} ${styles.skeletonTabs}`} />
      </div>
    </main>
  );
}
