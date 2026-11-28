import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { formatVND } from "@/lib/format";
import type { Product } from "./types";

// FDD 2.3 + mục 11 — SEO của trang chi tiết sản phẩm: mô tả và JSON-LD `Product`. Logic thuần, test được.
// Dữ liệu backend có thể thiếu (mô tả `null`, chưa có ảnh, đánh giá 0) nên mỗi trường phải có giá trị hợp lệ
// hoặc được BỎ HẲN: Google coi `description: ""`, `aggregateRating` 0 sao / 0 đánh giá, `brand` rỗng là sai.

/** Độ dài mô tả tối đa cho <meta description> / og:description (Google hiển thị khoảng 155–160 ký tự). */
export const META_DESCRIPTION_MAX = 160;

const collapse = (text: string) => text.replace(/\s+/g, " ").trim();

/** Cắt ở ranh giới từ gần nhất và thêm "…" nếu dài hơn `max`. */
export function truncateDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const clean = collapse(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

type DescribableProduct = Pick<Product, "name" | "brand" | "price" | "headline" | "description">;

/**
 * Mô tả đầy đủ (không cắt) dùng cho JSON-LD: mô tả của backend → dòng cấu hình → câu dựng từ tên, hãng, giá.
 * Luôn có nội dung, không bao giờ rỗng.
 */
export function productDescription(product: DescribableProduct): string {
  const own = collapse(product.description ?? "") || collapse(product.headline);
  if (own) return own;
  const brand = product.brand ? ` của ${product.brand}` : "";
  return `${product.name}${brand}, giá ${formatVND(product.price)}. Chính hãng, giao hàng toàn quốc tại ${siteConfig.name}.`;
}

/** Mô tả ngắn cho <meta description> và og:description. */
export function productMetaDescription(product: DescribableProduct): string {
  return truncateDescription(productDescription(product));
}

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

type JsonLdProduct = Pick<
  Product,
  "id" | "slug" | "name" | "brand" | "price" | "rating" | "reviewCount" | "inStock" | "images" | "headline" | "description"
>;

/** JSON-LD `Product` + `Offer`. Trường không có dữ liệu thật thì bỏ, không điền giá trị giả (0, "", []). */
export function productJsonLd(product: JsonLdProduct): Record<string, unknown> {
  const hasRating = product.reviewCount > 0 && product.rating >= 1 && product.rating <= 5;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productDescription(product),
    sku: product.id,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.images.length ? { image: product.images.map((i) => absolute(i.src)) } : {}),
    ...(hasRating
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
    offers: {
      "@type": "Offer",
      url: absolute(routes.product(product.slug)),
      priceCurrency: "VND",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}
