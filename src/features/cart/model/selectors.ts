// FDD 4.1 — Selector nhỏ, đúng phần cần; dữ liệu dẫn xuất qua createSelector (mục 7.2).
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartHydrated = (state: RootState) => state.cart.hydrated;

/** Tổng số sản phẩm (cộng số lượng) — dùng cho badge giỏ hàng ở header. */
export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((sum, i) => sum + i.quantity, 0),
);

export const selectSelectedItems = createSelector([selectCartItems], (items) => items.filter((i) => i.selected));

/** Tạm tính của các sản phẩm được chọn (chỉ hiển thị; server tính lại khi đặt hàng). */
export const selectSelectedSubtotal = createSelector([selectSelectedItems], (items) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0),
);

/** "Chọn tất cả" chỉ xét các dòng còn mua được (dòng hết hàng không chọn được). */
export const selectIsAllSelected = createSelector([selectCartItems], (items) => {
  const available = items.filter((i) => !i.unavailable);
  return available.length > 0 && available.every((i) => i.selected);
});

/** Khoá ổn định theo tập sản phẩm trong giỏ — để effect đồng bộ chỉ chạy lại khi thêm/xoá dòng. */
export const selectCartProductKey = createSelector([selectCartItems], (items) =>
  items
    .map((i) => i.productId)
    .sort()
    .join(","),
);
