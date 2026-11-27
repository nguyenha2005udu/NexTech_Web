"use client";

// FDD 5.1.2 — Đơn đã `pending` nhưng chưa có giao dịch (lúc đặt, backend còn xử lý): tự tạo giao dịch một lần khi trang mở.
// COD ở lại trang kết quả; PayOS chuyển sang trang thanh toán. Lỗi thì cho bấm thử lại.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { startPayment } from "../actions";
import styles from "./PaymentResult.module.css";

export function PaymentStarter({ orderId }: { orderId: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    const result = await startPayment({ orderId });
    if (!result.ok) return setError(result.message);
    if (result.data.redirectTo) window.location.assign(result.data.redirectTo);
    else router.refresh();
  }

  useEffect(() => {
    // StrictMode chạy effect 2 lần ở dev: chỉ tạo giao dịch một lần.
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi mở trang
  }, []);

  if (error === null) {
    return (
      <p role="status" className={styles.live}>
        Đang tạo thanh toán cho đơn hàng…
      </p>
    );
  }
  return (
    <div className={styles.live}>
      <p role="alert">{error}</p>
      <Button
        onClick={() => {
          setError(null);
          void run();
        }}
      >
        Thử lại
      </Button>
    </div>
  );
}
