"use client";

// FDD 4.1.2 — Một dòng trong giỏ: chọn để đặt, đổi số lượng, xoá (Figma 03.01).
import Image from "next/image";
import Link from "next/link";
import { Button, Checkbox } from "antd";
import { TrashIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { formatVND } from "@/lib/format";
import { useAppDispatch } from "@/lib/hooks";
import { removeItem, toggleSelected, updateQuantity, type CartItem } from "../model/cartSlice";
import styles from "./CartPage.module.css";

export function CartItemRow({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();
  const setQuantity = (quantity: number) => dispatch(updateQuantity({ productId: item.productId, quantity }));

  return (
    <li className={styles.row}>
      <Checkbox
        checked={item.selected}
        onChange={() => dispatch(toggleSelected(item.productId))}
        aria-label={`Chọn ${item.name} để đặt hàng`}
      />
      <span className={styles.thumb}>
        {item.imageSrc ? <Image src={item.imageSrc} alt="" width={60} height={34} /> : null}
      </span>
      <div>
        <Link href={routes.product(item.slug)} className={styles.name}>
          {item.name}
        </Link>
        <p className={styles.meta}>
          {item.summary} · SL {item.quantity}
        </p>
      </div>
      <span className={styles.linePrice}>{formatVND(item.price * item.quantity)}</span>
      <div className={styles.stepper} role="group" aria-label={`Số lượng ${item.name}`}>
        <Button
          aria-label="Giảm số lượng"
          className={styles.stepButton}
          disabled={item.quantity <= 1}
          onClick={() => setQuantity(item.quantity - 1)}
        >
          −
        </Button>
        <output className={styles.quantity} aria-live="polite">
          {item.quantity}
        </output>
        <Button
          aria-label="Tăng số lượng"
          className={styles.stepButton}
          disabled={item.quantity >= item.maxQuantity}
          onClick={() => setQuantity(item.quantity + 1)}
        >
          +
        </Button>
      </div>
      <Button
        danger
        icon={<TrashIcon size={16} />}
        onClick={() => dispatch(removeItem(item.productId))}
        aria-label={`Xóa ${item.name} khỏi giỏ`}
      >
        Xóa
      </Button>
    </li>
  );
}
