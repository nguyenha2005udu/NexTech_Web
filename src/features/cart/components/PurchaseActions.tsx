"use client";

// FDD 4.1.1 — Chọn số lượng, Mua ngay, Thêm vào giỏ (Figma 01.05). Trang chi tiết ghép qua slot `purchase`.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Button } from "antd";
import { ArrowRightIcon, ShoppingBagIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { useAppDispatch } from "@/lib/hooks";
import { MAX_QUANTITY_PER_ITEM, addItem, type CartProduct } from "../model/cartSlice";
import styles from "./cart.module.css";

type Props = { product: CartProduct; inStock: boolean };

export function PurchaseActions({ product, inStock }: Props) {
  const [quantity, setQuantity] = useState(1);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { message } = App.useApp();

  function addToCart() {
    dispatch(addItem({ product, quantity }));
    message.success(
      <span>
        Đã thêm {quantity} × {product.name} vào giỏ.{" "}
        <Link href={routes.cart} className={styles.toastLink}>
          Xem giỏ hàng
        </Link>
      </span>,
    );
  }

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
            disabled={!inStock || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </Button>
          <output className={styles.quantity} aria-live="polite" aria-label="Số lượng đã chọn">
            {quantity}
          </output>
          <Button
            aria-label="Tăng số lượng"
            className={styles.stepButton}
            disabled={!inStock || quantity >= MAX_QUANTITY_PER_ITEM}
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY_PER_ITEM, q + 1))}
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
          onClick={() => router.push(routes.checkoutBuyNow(product.slug, quantity))}
        >
          Mua ngay
        </Button>
        <Button icon={<ShoppingBagIcon />} disabled={!inStock} onClick={addToCart}>
          Thêm vào giỏ
        </Button>
      </div>
      {!inStock ? <p className={styles.outOfStock}>Sản phẩm tạm hết hàng.</p> : null}
    </>
  );
}
