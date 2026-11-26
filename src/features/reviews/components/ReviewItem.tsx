// Một đánh giá (FDD 2.3). Không dùng hook → render được ở cả server (ReviewSummary) lẫn client (Xem thêm).
import { StarIcon } from "@/components/ui/icons";
import type { Review } from "@/entities/review";
import { formatDate } from "@/lib/format";
import styles from "../reviews.module.css";

export function ReviewItem({ review }: { review: Review }) {
  return (
    <li className={styles.item}>
      <div className={styles.itemHeader}>
        <p className={styles.author}>{review.authorLabel}</p>
        <span className={styles.meta}>
          <span className={styles.stars} aria-label={`${review.rating} trên 5 sao`}>
            <StarIcon /> {review.rating}
          </span>
          · <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
        </span>
      </div>
      <p className={styles.content}>{review.content}</p>
    </li>
  );
}
