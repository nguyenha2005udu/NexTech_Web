"use client";

// FDD 4.1.2 — Sau khi nạp giỏ từ localStorage, hỏi server giá/tồn kho hiện tại và đối chiếu (giỏ lưu ở client có thể cũ).
// Lỗi mạng → giữ nguyên giỏ: checkout vẫn tính lại ở server nên không ảnh hưởng tính đúng đắn.
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { getCartSnapshots } from "../actions";
import { syncItems } from "../model/cartSlice";
import { selectCartHydrated, selectCartProductKey } from "../model/selectors";

export function useCartRefresh() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector(selectCartHydrated);
  const productKey = useAppSelector(selectCartProductKey);

  useEffect(() => {
    if (!hydrated || !productKey) return;
    let cancelled = false;
    getCartSnapshots({ productIds: productKey.split(",") })
      .then((result) => {
        if (!cancelled && result.ok) dispatch(syncItems(result.data));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated, productKey, dispatch]);
}
