// FDD 2.1 — Trang chủ. ISR 300s: sản phẩm nổi bật/khuyến mãi đổi định kỳ, cần SEO (mục 5).
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { categoryService } from "@/entities/category/service";
import { productService } from "@/entities/product/service";
import { HomeView } from "@/features/catalog";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — Công nghệ thế hệ mới` },
  alternates: { canonical: "/" },
  openGraph: { title: siteConfig.name, description: siteConfig.description, type: "website" },
};

export default async function Page() {
  const [categories, featured] = await Promise.all([categoryService.list(), productService.listFeatured()]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
          logo: `${siteConfig.url}/images/brand/nextech-logo.png`,
        }}
      />
      <HomeView categories={categories} featured={featured} />
    </>
  );
}
