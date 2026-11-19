// FDD 2.3 — Chi tiết sản phẩm (Figma 01.05).
// SSG + ISR 60s (mục 5): SEO quan trọng, giá/tồn kho đổi định kỳ. Khối đánh giá stream qua <Suspense>.
// Ghép feature: catalog (thông tin) + reviews (đánh giá) + cart (Mua ngay / Thêm vào giỏ, 4.1.1).
// Slot priceAlert (6.1.1) sẽ ghép khi có feature price-alerts.
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/JsonLd";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { categoryService } from "@/entities/category/service";
import type { Product } from "@/entities/product";
import { productService } from "@/entities/product/service";
import { PurchaseActions } from "@/features/cart";
import { ProductDetailView } from "@/features/catalog";
import { ReviewSummary, ReviewSummarySkeleton } from "@/features/reviews";
import { breadcrumbJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await productService.listPopular();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);
  if (!product) return {};
  // Ảnh chia sẻ lấy từ ./opengraph-image.tsx (PNG 1200×630), không đặt openGraph.images ở đây.
  return {
    title: product.name,
    description: product.headline,
    alternates: { canonical: routes.product(slug) },
    openGraph: { title: product.name, description: product.headline, url: routes.product(slug) },
  };
}

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

function productJsonLd(product: Product): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.headline,
    sku: product.id,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((i) => absolute(i.src)),
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    offers: {
      "@type": "Offer",
      url: absolute(routes.product(product.slug)),
      priceCurrency: "VND",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);
  if (!product) notFound();
  const category = await categoryService.getBySlug(product.categorySlug);

  const crumbs = [
    { label: "Trang chủ", href: routes.home },
    ...(category ? [{ label: category.name, href: routes.category(category.slug) }] : []),
    { label: product.name },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ProductDetailView
        product={product}
        crumbs={crumbs}
        purchase={
          <PurchaseActions
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              summary: product.summary,
              price: product.price,
              images: product.images.slice(0, 1),
            }}
            inStock={product.inStock}
          />
        }
        reviews={
          <Suspense fallback={<ReviewSummarySkeleton />}>
            <ReviewSummary productId={product.id} rating={product.rating} reviewCount={product.reviewCount} />
          </Suspense>
        }
      />
    </>
  );
}
