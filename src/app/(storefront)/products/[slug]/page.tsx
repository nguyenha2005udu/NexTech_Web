// FDD 2.3 — Chi tiết sản phẩm (Figma 01.05).
// SSG + ISR 60s (mục 5): SEO quan trọng, giá/tồn kho đổi định kỳ. Khối đánh giá stream qua <Suspense>.
// Ghép feature: catalog (thông tin) + reviews (đánh giá) + cart (Mua ngay / Thêm vào giỏ, 4.1.1).
// + price-alerts (Theo dõi giá, 6.1.1) qua slot priceAlert.
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/JsonLd";
import { routes } from "@/config/routes";
import { categoryService } from "@/entities/category/service";
import { productJsonLd, productMetaDescription } from "@/entities/product";
import { productService } from "@/entities/product/service";
import { orFallbackAtBuild } from "@/lib/build-safe";
import { PurchaseActions } from "@/features/cart";
import { ProductDetailView } from "@/features/catalog";
import { PriceAlertButton } from "@/features/price-alerts";
import { ReviewSummary, ReviewSummarySkeleton } from "@/features/reviews";
import { breadcrumbJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await orFallbackAtBuild(() => productService.listPopular(), []);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);
  if (!product) return {};
  // Ảnh chia sẻ lấy từ ./opengraph-image.tsx (PNG 1200×630), không đặt openGraph.images ở đây.
  // Backend có thể không có mô tả: productMetaDescription luôn trả câu hợp lệ (không để trang thiếu <meta description>).
  const description = productMetaDescription(product);
  return {
    title: product.name,
    description,
    alternates: { canonical: routes.product(slug) },
    openGraph: { title: product.name, description, url: routes.product(slug) },
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
              stockQuantity: product.stockQuantity,
            }}
            inStock={product.inStock}
          />
        }
        priceAlert={<PriceAlertButton productId={product.id} productName={product.name} price={product.price} />}
        reviews={
          <Suspense fallback={<ReviewSummarySkeleton />}>
            <ReviewSummary productId={product.id} rating={product.rating} reviewCount={product.reviewCount} />
          </Suspense>
        }
      />
    </>
  );
}
