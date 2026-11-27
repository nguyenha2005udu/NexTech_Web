"use client";

// FDD 5.1.2 — Đơn còn `processing` (backend trả 202): tự tải lại trang vài giây một lần để thấy kết quả khi backend xong.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./PaymentResult.module.css";

export const REFRESH_INTERVAL_MS = 3000;
/** 10 lần × 3 giây ≈ 30 giây, ngắn hơn hạn đối soát của backend */
export const MAX_REFRESHES = 10;

export function ProcessingRefresh() {
  const router = useRouter();
  const [refreshes, setRefreshes] = useState(0);
  const gaveUp = refreshes >= MAX_REFRESHES;

  useEffect(() => {
    if (gaveUp) return;
    const timer = setTimeout(() => {
      router.refresh();
      setRefreshes((n) => n + 1);
    }, REFRESH_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [gaveUp, refreshes, router]);

  return (
    <p role="status" className={styles.live}>
      {gaveUp
        ? "Đơn hàng vẫn đang được xử lý. Bạn có thể xem lại trong Đơn hàng của tôi sau ít phút."
        : "Đang cập nhật trạng thái đơn hàng…"}
    </p>
  );
}
