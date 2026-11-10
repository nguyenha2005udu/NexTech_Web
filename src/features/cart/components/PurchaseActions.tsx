"use client";

// FDD 4.1.1 — Chọn số lượng, Mua ngay, Thêm vào giỏ (Figma 01.05)
// TODO(cart): nối cartSlice (Redux Toolkit) và /checkout?buyNow= ở Sprint 3.
import { useState } from "react";
import { App, Button } from "antd";
import { ArrowRightIcon, ShoppingBagIcon } from "@/components/ui/icons";
import styles from "./cart.module.css";

type Props = { productName: string; inStock: boolean; maxQuantity?: number };

export function PurchaseActions({ productName, inStock, maxQuantity = 10 }: Props) {
  const [quantity, setQuantity] = useState(1);
  const { message } = App.useApp();

  return (
    <>
      <div className={styles.quantityRow}>
        <span className={styles.quantityLabel} id="qty-label">
          Số lượng
        </span>
        <div className={styles.stepper} role="group" aria-labelledby="qty-label">
          <Button
            aria-label="Giảm số lượng"
            className={styles.stepButton}
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </Button>
          <output className={styles.quantity} aria-live="polite">
            {quantity}
          </output>
          <Button
            aria-label="Tăng số lượng"
            className={styles.stepButton}
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          >
            +
          </Button>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          type="primary"
          icon={<ArrowRightIcon />}
          disabled={!inStock}
          onClick={() => message.info("Đặt hàng chưa được kết nối. Đây là bản giao diện.")}
        >
          Mua ngay
        </Button>
        <Button
          icon={<ShoppingBagIcon />}
          disabled={!inStock}
          onClick={() => message.success(`Đã thêm ${quantity} × ${productName} vào giỏ (bản giao diện).`)}
        >
          Thêm vào giỏ
        </Button>
      </div>
    </>
  );
}
