// FDD 4.1.1 — "Mua ngay" vào trang đặt hàng qua /checkout?buyNow=<slug>&qty=<n> (routes.checkoutBuyNow).
// Logic thuần: đọc tham số URL và đổi sản phẩm (đã lấy ở server) thành dòng đặt hàng.
import type { Product } from "@/entities/product";
import { MAX_QUANTITY_PER_LINE } from "./schemas";
import type { CheckoutLine } from "./types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** `null` khi không có buyNow. Số lượng sai / thiếu → 1, quá giới hạn → kẹp về giới hạn. */
export function parseBuyNowParams(params: RawSearchParams): { slug: string; quantity: number } | null {
  const slug = first(params.buyNow)?.trim();
  if (!slug) return null;
  const qty = Number(first(params.qty));
  const quantity = Number.isInteger(qty) && qty >= 1 ? Math.min(qty, MAX_QUANTITY_PER_LINE) : 1;
  return { slug, quantity };
}

/** Sản phẩm không còn bán / hết hàng → `null` (trang sẽ dùng giỏ hàng như bình thường). */
export function toBuyNowLine(product: Product | null, quantity: number): CheckoutLine | null {
  if (!product || !product.inStock) return null;
  return {
    productId: product.id,
    name: product.name,
    summary: product.summary,
    imageSrc: product.images[0]?.src,
    price: product.price,
    quantity,
  };
}
