// FDD 4.1 — Giỏ hàng (state nghiệp vụ toàn cục → Redux Toolkit, mục 7.1).
// Giá trong giỏ chỉ để HIỂN THỊ. placeOrder luôn tính lại giá ở server (mục 5), không tin giá client.
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "@/entities/product";

/** Giới hạn mỗi dòng trong giỏ khi chưa có số tồn kho thật từ backend. */
export const MAX_QUANTITY_PER_ITEM = 10;

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
  /** Được chọn để đặt hàng (Figma 03.01) */
  selected: boolean;
}

export interface CartState {
  items: CartItem[];
  /** Đã đọc giỏ của khách từ localStorage chưa (tránh ghi đè giỏ đã lưu bằng giỏ rỗng) */
  hydrated: boolean;
}

export type CartProduct = Pick<Product, "id" | "slug" | "name" | "summary" | "price" | "images">;

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
        quantity: clamp(quantity, MAX_QUANTITY_PER_ITEM),
        maxQuantity: MAX_QUANTITY_PER_ITEM,
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
      if (item) item.selected = !item.selected;
    },
    setAllSelected(state, action: PayloadAction<boolean>) {
      state.items.forEach((i) => {
        i.selected = action.payload;
      });
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

export const { addItem, removeItem, updateQuantity, toggleSelected, setAllSelected, clearCart, hydrateCart } =
  cartSlice.actions;
export const cartReducer = cartSlice.reducer;
