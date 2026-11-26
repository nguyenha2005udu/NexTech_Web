// SEO (mục 11) — Ảnh chia sẻ 1200×630 cho trang chi tiết sản phẩm (FDD 2.3).
// Slug lạ trả ảnh chung của NexTech.
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { productService } from "@/entities/product/service";
import { orFallbackAtBuild } from "@/lib/build-safe";
import { formatNumber } from "@/lib/format";
import { OG_SIZE, OgCard, publicImageDataUri } from "@/lib/og";

export const alt = `Sản phẩm tại ${siteConfig.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 60;

// Prerender ảnh cùng danh sách slug với page (SSG + ISR như trang chi tiết).
export async function generateStaticParams() {
  const products = await orFallbackAtBuild(() => productService.listPopular(), []);
  return products.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);

  if (!product) {
    return new ImageResponse(<OgCard eyebrow="Cửa hàng công nghệ" title={siteConfig.name} />, size);
  }

  const image = product.images[0];
  return new ImageResponse(
    (
      <OgCard
        eyebrow={product.brand}
        title={product.name}
        subtitle={product.summary}
        // Font mặc định (Geist) không có ký tự "₫" → dùng "đ" để không phải tải font lúc build.
        highlight={`${formatNumber(product.price)}đ`}
        imageDataUri={image ? await publicImageDataUri(image.src) : null}
      />
    ),
    size,
  );
}
