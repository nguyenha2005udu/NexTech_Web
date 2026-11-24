"use client";

// FDD 5.2.5 — Huỷ đơn (Figma 04.07). Có hộp xác nhận vì thao tác không hoàn tác được.
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { App, Button } from "antd";
import { baseApi } from "@/lib/api/baseApi";
import { useAppDispatch } from "@/lib/hooks";
import { cancelOrder } from "../actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const { message, modal } = App.useApp();
  const router = useRouter();
  const dispatch = useAppDispatch();

  function confirmCancel() {
    modal.confirm({
      title: "Huỷ đơn hàng này?",
      content: "Sau khi huỷ, bạn không thể khôi phục đơn.",
      okText: "Huỷ đơn",
      cancelText: "Giữ đơn",
      okButtonProps: { danger: true },
      onOk: () =>
        new Promise<void>((resolve) => {
          startTransition(async () => {
            const result = await cancelOrder({ orderId });
            if (result.ok) {
              message.success("Đã huỷ đơn hàng");
              dispatch(baseApi.util.invalidateTags(["Notification"]));
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
    <Button danger loading={pending} onClick={confirmCancel}>
      Huỷ đơn
    </Button>
  );
}
