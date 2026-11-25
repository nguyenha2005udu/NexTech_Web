"use client";

// FDD 6.1.3 — Xoá cảnh báo giá (có hộp xác nhận).
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { App, Button } from "antd";
import { removePriceAlert } from "../actions";

export function RemovePriceAlertButton({ alertId, productName }: { alertId: string; productName: string }) {
  const [pending, startTransition] = useTransition();
  const { message, modal } = App.useApp();
  const router = useRouter();

  function confirmRemove() {
    modal.confirm({
      title: "Xoá cảnh báo giá?",
      content: `Bạn sẽ không còn nhận thông báo khi ${productName} giảm giá.`,
      okText: "Xoá",
      cancelText: "Giữ lại",
      okButtonProps: { danger: true },
      onOk: () =>
        new Promise<void>((resolve) => {
          startTransition(async () => {
            const result = await removePriceAlert({ alertId });
            if (result.ok) {
              message.success("Đã xoá cảnh báo giá");
              router.refresh();
            } else {
              message.error(result.message);
            }
            resolve();
          });
        }),
    });
  }

  return (
    <Button danger loading={pending} onClick={confirmRemove}>
      Xoá
    </Button>
  );
}
