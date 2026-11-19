"use client";

// FDD 4.1 — Đồng bộ giỏ Redux ⇄ localStorage. Không render gì.
// Nạp sau khi mount (không đọc localStorage lúc render → không lệch hydration, mục 6).
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { CART_STORAGE_KEY, loadCart, saveCart } from "../cart.storage";
import { hydrateCart } from "../model/cartSlice";
import { selectCartHydrated, selectCartItems } from "../model/selectors";

export function CartPersistence() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const hydrated = useAppSelector(selectCartHydrated);

  useEffect(() => {
    dispatch(hydrateCart(loadCart(window.localStorage)));

    // Tab khác sửa giỏ → nạp lại để các tab luôn giống nhau.
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY || e.key === null) dispatch(hydrateCart(loadCart(window.localStorage)));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);

  useEffect(() => {
    // Chưa nạp xong thì không ghi, tránh xoá giỏ đã lưu bằng giỏ rỗng ban đầu.
    if (hydrated) saveCart(window.localStorage, items);
  }, [hydrated, items]);

  return null;
}
