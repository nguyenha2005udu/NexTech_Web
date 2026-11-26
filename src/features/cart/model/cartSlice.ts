// FDD 4.1 — Giỏ hàng (state nghiệp vụ toàn cục → Redux Toolkit, mục 7.1).
// Giá trong giỏ chỉ để HIỂN THỊ. placeOrder luôn tính lại giá ở server (mục 5), không tin giá client.
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "@/entities/product";

/** Giới hạn mỗi dòng trong giỏ (và mức tối đa khi chưa biết tồn kho). */
export const MAX_QUANTITY_PER_ITEM = 10;

/** Số lượng tối đa của một dòng: kẹp theo tồn kho nếu biết, luôn trong [1, MAX_QUANTITY_PER_ITEM]. */
export function maxQuantityFor(stockQuantity?: number): number {
  if (stockQuantity === undefined || !Number.isFinite(stockQuantity)) return MAX_QUANTITY_PER_ITEM;
  return Math.min(Math.max(Math.trunc(stockQuantity), 1), MAX_QUANTITY_PER_ITEM);
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  summary: string;
  imageSrc?: string;
  /** Giá lúc thêm vào giỏ — chỉ để hiển thị */
  price: number;
  quantity: number;
  maxQuantity: number;
  /** Giá trước khi đổi — có khi lần đồng bộ gần nhất thấy giá khác giá đã lưu (hiện cảnh báo ở giỏ) */
  previousPrice?: number;
  /** Hết hàng hoặc ngừng bán: không chọn / đặt được */
  unavailable?: boolean;
  /** Được chọn để đặt hàng (Figma 03.01) */
  selected: boolean;
}

export interface CartState {
  items: CartItem[];
  /** Đã đọc giỏ của khách từ localStorage chưa (tránh ghi đè giỏ đã lưu bằng giỏ rỗng) */
  hydrated: boolean;
}

export type CartProduct = Pick<Product, "id" | "slug" | "name" | "summary" | "price" | "images"> &
  Partial<Pick<Product, "stockQuantity">>;

/** Giá + tồn kho hiện tại của một sản phẩm trong giỏ, do server trả (xem `getCartSnapshots`). */
export interface CartSnapshot {
  productId: string;
  price: number;
  stockQuantity?: number;
  available: boolean;
}

export const initialCartState: CartState = { items: [], hydrated: false };

const clamp = (quantity: number, max: number) => Math.min(Math.max(Math.trunc(quantity), 1), max);

const cartSlice = createSlice({
  name: "cart",
  initialState: initialCartState,
  reducers: {
    addItem(state, action: PayloadAction<{ product: CartProduct; quantity: number }>) {
      const { product, quantity } = action.payload;
      if (!Number.isFinite(quantity) || quantity < 1) return;
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        // Thêm trùng → cộng dồn, cập nhật lại thông tin hiển thị theo dữ liệu mới nhất.
        existing.maxQuantity = maxQuantityFor(product.stockQuantity);
        existing.quantity = clamp(existing.quantity + quantity, existing.maxQuantity);
        existing.price = product.price;
        existing.name = product.name;
        existing.selected = true;
        return;
      }
      state.items.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        summary: product.summary,
        imageSrc: product.images[0]?.src,
        price: product.price,
        quantity: clamp(quantity, maxQuantityFor(product.stockQuantity)),
        maxQuantity: maxQuantityFor(product.stockQuantity),
        selected: true,
      });
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (!item || !Number.isFinite(action.payload.quantity)) return;
      item.quantity = clamp(action.payload.quantity, item.maxQuantity);
    },
    toggleSelected(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.productId === action.payload);
      if (item && !item.unavailable) item.selected = !item.selected;
    },
    setAllSelected(state, action: PayloadAction<boolean>) {
      state.items.forEach((i) => {
        i.selected = action.payload && !i.unavailable;
      });
    },
    /**
     * Đối chiếu giỏ với giá/tồn kho hiện tại từ server. Sản phẩm không còn trong kết quả hoặc hết hàng → đánh dấu
     * `unavailable` và bỏ chọn; giá đổi → lưu `previousPrice`; tồn kho giảm → kẹp lại số lượng.
     */
    syncItems(state, action: PayloadAction<CartSnapshot[]>) {
      const byId = new Map(action.payload.map((s) => [s.productId, s]));
      for (const item of state.items) {
        const snap = byId.get(item.productId);
        if (!snap || !snap.available) {
          item.unavailable = true;
          item.selected = false;
          delete item.previousPrice;
          continue;
        }
        delete item.unavailable;
        if (snap.price !== item.price) item.previousPrice = item.price;
        else delete item.previousPrice;
        item.price = snap.price;
        item.maxQuantity = maxQuantityFor(snap.stockQuantity);
        item.quantity = clamp(item.quantity, item.maxQuantity);
      }
    },
    clearCart(state) {
      state.items = [];
    },
    /** Nạp giỏ đã lưu (localStorage, sau này là giỏ server khi đăng nhập). */
    hydrateCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.hydrated = true;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  toggleSelected,
  setAllSelected,
  syncItems,
  clearCart,
  hydrateCart,
} = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
