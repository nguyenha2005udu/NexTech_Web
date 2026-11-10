// FDD 2.1 — Trang danh mục (Figma 01.02). SSG + ISR 300s: trang đích SEO theo nhu cầu (mục 5).
// Bộ lọc đọc từ URL ở client (CategoryProductBrowser) để trang vẫn tĩnh.
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { categoryService } from "@/entities/category/service";
import { getFilterFacets } from "@/entities/product";
import { productService } from "@/entities/product/service";
import { CategoryProductBrowser, ListingView, ProductGrid } from "@/features/catalog";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await categoryService.list();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await categoryService.getBySlug(slug);
  if (!category) return {};
  const title = category.title ?? category.name;
  return {
    title,
    description: category.description,
    alternates: { canonical: routes.category(slug) },
    openGraph: { title, description: category.description },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const category = await categoryService.getBySlug(slug);
  if (!category) notFound();
  const products = await productService.listByCategory(slug);

  return (
    <ListingView
      crumbs={[{ label: "Trang chủ", href: routes.home }, { label: "Danh mục", href: `${routes.home}#danh-muc` }, { label: category.name }]}
      title={category.title ?? category.name}
      description={category.description}
      facets={getFilterFacets(products)}
    >
      <Suspense fallback={<ProductGrid products={products} columns={3} />}>
        <CategoryProductBrowser products={products} />
      </Suspense>
    </ListingView>
  );
}
