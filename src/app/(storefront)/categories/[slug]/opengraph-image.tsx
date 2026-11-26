// SEO (mục 11) — Ảnh chia sẻ 1200×630 cho trang danh mục (FDD 2.1).
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { categoryService } from "@/entities/category/service";
import { productService } from "@/entities/product/service";
import { orFallbackAtBuild } from "@/lib/build-safe";
import { OG_SIZE, OgCard } from "@/lib/og";

export const alt = `Danh mục sản phẩm tại ${siteConfig.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

// Prerender ảnh cùng danh sách slug với page (SSG + ISR như trang danh mục).
export async function generateStaticParams() {
  const categories = await orFallbackAtBuild(() => categoryService.list(), []);
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    categoryService.getBySlug(slug),
    productService.listByCategory(slug),
  ]);

  if (!category) {
    return new ImageResponse(<OgCard eyebrow="Cửa hàng công nghệ" title={siteConfig.name} />, size);
  }

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Danh mục"
        title={category.title ?? category.name}
        subtitle={category.description ?? siteConfig.description}
        highlight={products.length ? `${products.length} sản phẩm` : undefined}
      />
    ),
    size,
  );
}
