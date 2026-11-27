"use client";

// FDD 5.1.2 — "Thanh toán lại" ở trang kết quả (Figma 03.11): xin link PayOS mới rồi chuyển sang PayOS.
import { useTransition } from "react";
import { App, Button } from "antd";
import { retryPayment } from "../actions";

export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  return (
    <Button
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await retryPayment({ orderId });
          if (result.ok) window.location.assign(result.data.redirectTo);
          else message.error(result.message);
        })
      }
    >
      Thanh toán lại
    </Button>
  );
}
