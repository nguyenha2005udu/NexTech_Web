"use client";

// FDD 4.1 — Số sản phẩm trong giỏ trên header. Chỉ hiện sau khi đã nạp giỏ từ localStorage,
// nên HTML server (luôn chưa có giỏ) và lần render đầu ở client giống nhau — không lệch hydration.
import { useAppSelector } from "@/lib/hooks";
import { selectCartCount, selectCartHydrated } from "../model/selectors";
import styles from "./CartBadge.module.css";

type Props = { variant?: "inline" | "overlay" };

export function CartBadge({ variant = "inline" }: Props) {
  const count = useAppSelector(selectCartCount);
  const hydrated = useAppSelector(selectCartHydrated);
  if (!hydrated || count === 0) return null;

  return (
    <span className={`${styles.badge} ${variant === "overlay" ? styles.overlay : ""}`}>
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
      <span className="sr-only">({count} sản phẩm)</span>
    </span>
  );
}
