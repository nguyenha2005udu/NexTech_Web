// FDD 2.3 — Hiển thị đánh giá ở trang chi tiết (Figma 01.05).
// Server Component async: page bọc <Suspense> để khối này stream sau phần thông tin chính (mục 5).
import { StarIcon } from "@/components/ui/icons";
import { reviewService } from "@/entities/review/service";
import { formatDate, formatRating } from "@/lib/format";
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
      {reviews.length ? (
        <ul className={styles.list}>
          {reviews.map((r) => (
            <li key={r.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <p className={styles.author}>{r.authorLabel}</p>
                <span className={styles.meta}>
                  <span className={styles.stars} aria-label={`${r.rating} trên 5 sao`}>
                    <StarIcon /> {r.rating}
                  </span>
                  · <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
                </span>
              </div>
              <p className={styles.content}>{r.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.content}>Chưa có đánh giá nào cho sản phẩm này.</p>
      )}
    </div>
  );
}

export function ReviewSummarySkeleton() {
  return <div className={styles.skeleton} aria-busy="true" aria-label="Đang tải đánh giá" />;
}
