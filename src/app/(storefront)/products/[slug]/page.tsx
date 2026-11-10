// FDD 2.3 — Chi tiết sản phẩm (Figma 01.05) + 4.1.1 giỏ hàng + 6.1.1 cảnh báo giá (Figma 01.06).
// SSG + ISR 60s: SEO quan trọng, giá/tồn kho đổi định kỳ. Khối đánh giá stream qua <Suspense>.
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/JsonLd";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { categoryService } from "@/entities/category/service";
import { productService } from "@/entities/product/service";
import { PurchaseActions } from "@/features/cart";
import { ProductDetailView } from "@/features/catalog";
import { PriceAlertButton } from "@/features/price-alerts";
import { ReviewSummary, ReviewSummarySkeleton } from "@/features/reviews";

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
  return {
    title: product.name,
    description: product.headline,
    alternates: { canonical: routes.product(slug) },
    openGraph: { title: product.name, description: product.headline, type: "website" },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);
  if (!product) notFound();
  const category = await categoryService.getBySlug(product.categorySlug);
  const url = `${siteConfig.url}${routes.product(product.slug)}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.headline,
          brand: { "@type": "Brand", name: product.brand },
          image: product.images.map((i) => `${siteConfig.url}${i.src}`),
          aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "VND",
            price: product.price,
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }}
      />
      <ProductDetailView
        product={product}
        category={category}
        purchase={<PurchaseActions productName={product.name} inStock={product.inStock} />}
        priceAlert={
          <PriceAlertButton
            productId={product.id}
            productName={product.name}
            summary={product.summary}
            imageSrc={product.images[0]?.src}
            price={product.price}
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
