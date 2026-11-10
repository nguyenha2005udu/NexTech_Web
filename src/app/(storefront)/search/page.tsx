// FDD 2.2 — Tìm kiếm, lọc, sắp xếp (Figma 01.03, 01.04). SSR: phụ thuộc từ khoá & bộ lọc từng request.
import type { Metadata } from "next";
import { routes } from "@/config/routes";
import { getFilterFacets, parseProductFilters } from "@/entities/product";
import { productService } from "@/entities/product/service";
import { EmptyResult, ListingView, ProductGrid, ResultCount } from "@/features/catalog";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "Tìm kiếm sản phẩm",
  robots: { index: false, follow: true },
  alternates: { canonical: routes.search },
};

export default async function Page({ searchParams }: Props) {
  const filters = parseProductFilters(await searchParams);
  const [{ items, total }, all] = await Promise.all([productService.search(filters), productService.listPopular()]);

  const title = !items.length
    ? "Không tìm thấy sản phẩm"
    : filters.q
      ? `Kết quả cho “${filters.q}”`
      : "Tất cả sản phẩm";

  return (
    <ListingView
      crumbs={[{ label: "Trang chủ", href: routes.home }, { label: "Tìm kiếm" }]}
      title={title}
      description="Lọc theo thương hiệu, khoảng giá và thông số để chọn cấu hình phù hợp."
      facets={getFilterFacets(all)}
    >
      {items.length ? (
        <>
          <ProductGrid products={items} columns={3} />
          <ResultCount shown={items.length} total={total} />
        </>
      ) : (
        <EmptyResult />
      )}
    </ListingView>
  );
}
