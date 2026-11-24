// FDD 4.1 — Giỏ của khách lưu ở localStorage (giả định kỹ thuật #2). Đăng nhập thì gộp lên server (cart.sync, sau).
// Dữ liệu localStorage do người dùng sửa được / có thể là bản cũ → validate bằng zod, bỏ dòng hỏng.
import { z } from "zod";
import { MAX_QUANTITY_PER_ITEM, type CartItem } from "./model/cartSlice";

/** Đổi `v1` khi cấu trúc CartItem thay đổi không tương thích. */
export const CART_STORAGE_KEY = "nextech:cart:v1";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string(),
  summary: z.string(),
  imageSrc: z.string().optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1),
  maxQuantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
  previousPrice: z.number().nonnegative().optional(),
  unavailable: z.boolean().optional(),
  selected: z.boolean(),
});

/** Đọc giỏ đã lưu. Không có / hỏng / trình duyệt chặn storage → giỏ rỗng. */
export function loadCart(storage: Storage): CartItem[] {
  let raw: string | null;
  try {
    raw = storage.getItem(CART_STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const entry of parsed) {
    const result = cartItemSchema.safeParse(entry);
    if (!result.success || seen.has(result.data.productId)) continue;
    seen.add(result.data.productId);
    items.push({ ...result.data, quantity: Math.min(result.data.quantity, result.data.maxQuantity) });
  }
  return items;
}

/** Ghi giỏ. Bỏ qua lỗi (chế độ riêng tư, hết dung lượng): giỏ vẫn còn trong Redux cho phiên hiện tại. */
export function saveCart(storage: Storage, items: CartItem[]): void {
  try {
    if (items.length) storage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    else storage.removeItem(CART_STORAGE_KEY);
  } catch {
    // không làm gì
  }
}
