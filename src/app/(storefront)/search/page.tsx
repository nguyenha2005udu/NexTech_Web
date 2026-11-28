// FDD 2.2 — Tìm kiếm, lọc, sắp xếp, phân trang (Figma 01.03, 01.04).
// SSR: kết quả phụ thuộc từ khoá & bộ lọc từng request (đọc searchParams → tự dynamic). noindex (mục 11).
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { SEARCH_PAGE_SIZE, getFilterFacets, parseProductFilters, searchHref, type RawSearchParams } from "@/entities/product";
import { productService } from "@/entities/product/service";
import { EmptyResult, ListingView, ProductGrid, ResultCount, SearchPager } from "@/features/catalog";
import { positiveInt } from "@/lib/pagination";

type Props = { searchParams: Promise<RawSearchParams> };

export const metadata: Metadata = {
  title: "Tìm kiếm sản phẩm",
  robots: { index: false, follow: true },
  alternates: { canonical: routes.search },
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseProductFilters(params);
  const page = positiveInt(params.page, 1);
  // Facet lấy từ TOÀN BỘ sản phẩm (mọi trang) để luôn thấy đủ hãng/thông số, kể cả khi kết quả rỗng.
  const [result, all] = await Promise.all([productService.search(filters, page), productService.listAll()]);

  // ?page= quá số trang (vd. link cũ, sau khi lọc ít đi) → về trang cuối của kết quả hiện tại.
  if (page > result.totalPages && result.total > 0) redirect(searchHref(routes.search, filters, result.totalPages));

  const { items, total } = result;
  const title = !items.length ? "Không tìm thấy sản phẩm" : filters.q ? `Kết quả cho “${filters.q}”` : "Tất cả sản phẩm";

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
          <ResultCount shown={items.length} total={total} from={(result.page - 1) * SEARCH_PAGE_SIZE + 1} />
          <SearchPager filters={filters} page={result.page} totalPages={result.totalPages} />
        </>
      ) : (
        <EmptyResult />
      )}
    </ListingView>
  );
}
