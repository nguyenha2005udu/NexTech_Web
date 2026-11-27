"use client";

// FDD 5.1.2 — "Đặt lại" khi đơn đã huỷ / hết hạn giữ hàng: nạp lại các sản phẩm của đơn vào giỏ rồi sang giỏ hàng.
// (Đặt xong thì các dòng đã đặt bị bỏ khỏi giỏ, nên không thể chỉ chuyển sang giỏ.)
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { App, Button } from "antd";
import { routes } from "@/config/routes";
import { addItem } from "@/features/cart";
import { useAppDispatch } from "@/lib/hooks";
import { reorderItems } from "../actions";

export function ReorderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { message } = App.useApp();

  return (
    <Button
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await reorderItems({ orderId });
          if (!result.ok) return void message.error(result.message);
          const { lines, skipped } = result.data;
          if (!lines.length) return void message.error("Các sản phẩm trong đơn này hiện không còn bán.");
          lines.forEach(({ product, quantity }) => dispatch(addItem({ product, quantity })));
          if (skipped > 0) message.warning(`${skipped} sản phẩm đã hết hàng hoặc ngừng bán nên không được thêm vào giỏ.`);
          router.push(routes.cart);
        })
      }
    >
      Đặt lại
    </Button>
  );
}
