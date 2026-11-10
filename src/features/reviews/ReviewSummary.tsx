// FDD 2.3 — Hiển thị đánh giá ở trang chi tiết (Figma 01.05)
import { reviewService } from "@/entities/review/service";
import { formatRating } from "@/lib/format";
import styles from "./reviews.module.css";

type Props = { productId: string; rating: number; reviewCount: number };

export async function ReviewSummary({ productId, rating, reviewCount }: Props) {
  const reviews = await reviewService.listByProduct(productId);
  return (
    <div className={styles.summary}>
      <h3 className={styles.title}>Đánh giá từ người mua</h3>
      <p className={styles.score}>
        {formatRating(rating)} / 5 · {reviewCount} đánh giá
      </p>
      <ul className={styles.list}>
        {reviews.map((r) => (
          <li key={r.id} className={styles.item}>
            <p className={styles.author}>{r.authorLabel}</p>
            <p className={styles.content}>{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewSummarySkeleton() {
  return <div className={styles.skeleton} aria-busy="true" aria-label="Đang tải đánh giá" />;
}
