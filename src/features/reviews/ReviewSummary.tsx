// FDD 2.3 — Hiển thị đánh giá ở trang chi tiết (Figma 01.05).
// Server Component async: page bọc <Suspense> để khối này stream sau phần thông tin chính (mục 5).
// Chỉ render trang đầu ở server; các trang sau do ReviewLoadMore tải phía client.
import { REVIEW_PAGE_SIZE } from "@/entities/review";
import { reviewService } from "@/entities/review/service";
import { formatRating } from "@/lib/format";
import { ReviewItem } from "./components/ReviewItem";
import { ReviewLoadMore } from "./components/ReviewLoadMore";
import styles from "./reviews.module.css";

type Props = { productId: string; rating: number; reviewCount: number };

export async function ReviewSummary({ productId, rating, reviewCount }: Props) {
  const { items, total } = await reviewService.listPage(productId, 1, REVIEW_PAGE_SIZE);
  return (
    <div className={styles.summary}>
      <h3 className={styles.title}>Đánh giá từ người mua</h3>
      {/* Chưa có ai chấm thì "0,0 / 5" chỉ gây hiểu nhầm — câu "Chưa có đánh giá nào…" bên dưới đã đủ */}
      {reviewCount > 0 ? (
        <p className={styles.score}>
          {formatRating(rating)} / 5 · {reviewCount} đánh giá
        </p>
      ) : null}
      {items.length ? (
        <>
          <ul className={styles.list}>
            {items.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </ul>
          <ReviewLoadMore productId={productId} loaded={items.length} total={total} />
        </>
      ) : (
        <p className={styles.content}>Chưa có đánh giá nào cho sản phẩm này.</p>
      )}
    </div>
  );
}

export function ReviewSummarySkeleton() {
  return <div className={styles.skeleton} aria-busy="true" aria-label="Đang tải đánh giá" />;
}
