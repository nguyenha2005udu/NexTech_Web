"use client";

// FDD 2.3 — "Xem thêm đánh giá": tải các trang kế tiếp từ /api/products/:id/reviews và nối vào danh sách.
import { useState } from "react";
import { Button } from "antd";
import type { Review } from "@/entities/review";
import { useLazyGetProductReviewsQuery } from "../api/reviewsApi";
import { ReviewItem } from "./ReviewItem";
import styles from "../reviews.module.css";

type Props = {
  productId: string;
  /** Số đánh giá đã hiển thị sẵn ở server (trang 1) */
  loaded: number;
  total: number;
};

export function ReviewLoadMore({ productId, loaded, total }: Props) {
  const [fetchPage, { isFetching }] = useLazyGetProductReviewsQuery();
  const [extra, setExtra] = useState<Review[]>([]);
  const [nextPage, setNextPage] = useState(2);
  const [failed, setFailed] = useState(false);
  const remaining = total - loaded - extra.length;

  async function loadMore() {
    setFailed(false);
    try {
      const page = await fetchPage({ productId, page: nextPage }).unwrap();
      setExtra((prev) => [...prev, ...page.items]);
      setNextPage(nextPage + 1);
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      {extra.length ? (
        <ul className={styles.list}>
          {extra.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      ) : null}
      {failed ? (
        <p role="alert" className={styles.content}>
          Không tải được thêm đánh giá. Vui lòng thử lại.
        </p>
      ) : null}
      {remaining > 0 ? (
        <Button block loading={isFetching} onClick={loadMore} className={styles.loadMore}>
          {failed ? "Thử lại" : `Xem thêm đánh giá (${remaining})`}
        </Button>
      ) : null}
    </>
  );
}
