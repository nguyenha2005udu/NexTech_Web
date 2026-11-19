import styles from "./Listing.module.css";

export function ResultCount({ shown, total }: { shown: number; total: number }) {
  return (
    <p className={styles.count} aria-live="polite">
      Hiển thị {shown} / {total} sản phẩm
    </p>
  );
}
