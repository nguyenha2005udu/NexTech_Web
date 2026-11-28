import "server-only";
import { ApiError, apiFetchPublic } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import { SEARCH_PAGE_SIZE, applyProductFilters } from "./filters";
import type { Product, ProductFilters, ProductSort, ProductTag } from "./types";

// FDD 2.x — Sản phẩm phía khách. Gọi `GET /api/products[/:id]` của catalog-service (công khai, ISR 60 s).
// Backend không có `slug`: dùng `id` làm `slug` trong URL (`/products/<id>`).

const REVALIDATE = 60;
const PAGE_LIMIT = 100;
/** Chặn vòng lặp lấy hết sản phẩm: tối đa 20 trang × 100 = 2.000 sản phẩm. */
const MAX_PAGES = 20;
const TAGS: readonly ProductTag[] = ["Học tập", "Văn phòng", "Gaming", "Phụ kiện"];

interface RawTag {
  id?: string;
  name: string;
}
interface RawListItem {
  id: string;
  name: string;
  brand: string | null;
  price: string | number;
  rating: string | number | null;
  primary_image: string | null;
  category_name: string | null;
  tags?: RawTag[];
}
interface RawDetail {
  id: string;
  name: string;
  category_id: string | null;
  brand: string | null;
  price: string | number;
  rating: string | number | null;
  description: string | null;
  stock_quantity: number;
  is_active: boolean;
  review_count?: number;
  specs?: Array<{ spec_key: string; spec_value: string; spec_unit: string | null }>;
  tags?: RawTag[];
  images?: Array<{ image_url: string; is_primary: boolean; sort_order: number }>;
}

const SORT_TO_BACKEND: Record<ProductSort, string | undefined> = {
  relevance: undefined,
  "price-asc": "price_asc",
  "price-desc": "price_desc",
  rating: "rating_desc",
};

const toTag = (tags: RawTag[] | undefined): ProductTag =>
  TAGS.find((t) => tags?.some((x) => x.name === t)) ?? "Phụ kiện";

const specValue = (s: { spec_value: string; spec_unit: string | null }) =>
  s.spec_unit ? `${s.spec_value} ${s.spec_unit}` : s.spec_value;

function fromListItem(raw: RawListItem): Product {
  return {
    id: raw.id,
    slug: raw.id,
    name: raw.name,
    brand: raw.brand ?? "",
    categorySlug: "",
    tag: toTag(raw.tags),
    summary: raw.category_name ?? "",
    headline: raw.category_name ?? "",
    price: Number(raw.price),
    rating: Number(raw.rating ?? 0),
    reviewCount: 0,
    inStock: true,
    specs: [],
    images: raw.primary_image ? [{ src: raw.primary_image, alt: raw.name }] : [],
  };
}

function fromDetail(raw: RawDetail): Product {
  const specs = (raw.specs ?? []).map((s) => ({ label: s.spec_key, value: specValue(s) }));
  const find = (re: RegExp) => specs.find((s) => re.test(s.label))?.value;
  const images = [...(raw.images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((i) => ({ src: i.image_url, alt: raw.name }));
  const summary = specs.slice(0, 3).map((s) => s.value).join(" · ");
  return {
    id: raw.id,
    slug: raw.id,
    name: raw.name,
    brand: raw.brand ?? "",
    categorySlug: raw.category_id ?? "",
    tag: toTag(raw.tags),
    summary,
    headline: summary || raw.description || "",
    description: raw.description ?? undefined,
    price: Number(raw.price),
    rating: Number(raw.rating ?? 0),
    reviewCount: raw.review_count ?? 0,
    inStock: raw.is_active && raw.stock_quantity > 0,
    ram: find(/^ram$/i),
    cpu: find(/^(cpu|vi xử lý)$/i),
    specs,
    images,
  };
}

// Trợ lý AI trả sản phẩm gợi ý đúng shape `GET /api/products` (NT.ASSISTANT_CONVERSATION §4): dùng chung bộ đổi.
export type { RawListItem as RawProductListItem };
export { fromListItem as productFromListItem };

async function list(query: Record<string, string | number | undefined>): Promise<Paginated<Product>> {
  const page = await apiFetchPublic<Paginated<RawListItem>>(
    `/api/products${toQueryString({ limit: PAGE_LIMIT, ...query })}`,
    REVALIDATE,
  );
  return { ...page, items: page.items.map(fromListItem) };
}

/** Lấy HẾT các trang của một truy vấn (backend tối đa 100 sản phẩm/trang). */
async function listEvery(query: Record<string, string | number | undefined>): Promise<Paginated<Product>> {
  const first = await list({ ...query, page: 1 });
  const pages = Math.min(first.totalPages || Math.ceil(first.total / PAGE_LIMIT), MAX_PAGES);
  const rest = await Promise.all(Array.from({ length: Math.max(pages - 1, 0) }, (_, i) => list({ ...query, page: i + 2 })));
  return { ...first, items: [...first.items, ...rest.flatMap((p) => p.items)] };
}

export interface SearchResult {
  /** Sản phẩm của trang hiện tại */
  items: Product[];
  /** Tổng số sản phẩm khớp (mọi trang, sau mọi bộ lọc) */
  total: number;
  page: number;
  totalPages: number;
}

async function fetchDetail(id: string, revalidate: number): Promise<Product | null> {
  try {
    return fromDetail(await apiFetchPublic<RawDetail>(`/api/products/${encodeURIComponent(id)}`, revalidate));
  } catch (err) {
    // 404: không có / ngừng bán. 400: id sai định dạng.
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export const productService = {
  async listFeatured(): Promise<Product[]> {
    return (await list({ sort: "rating_desc", limit: 8 })).items;
  },

  async listPopular(): Promise<Product[]> {
    return (await list({})).items;
  },

  /** `categoryId` là id danh mục của backend (UUID); giá trị khác (slug mock cũ) → rỗng. */
  async listByCategory(categoryId: string): Promise<Product[]> {
    try {
      return (await list({ categoryId })).items;
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) return [];
      throw err;
    }
  },

  /** Toàn bộ sản phẩm (mọi trang) — để dựng danh sách hãng/thông số cho bộ lọc, không bị cụt ở 100 sản phẩm đầu. */
  async listAll(): Promise<Product[]> {
    return (await listEvery({})).items;
  },

  /**
   * Tìm kiếm có phân trang (FDD 2.2). Backend lọc từ khoá, MỘT hãng, khoảng giá, sắp xếp và phân trang. Nhiều hãng hoặc
   * RAM/CPU backend chưa lọc được: khi đó lấy hết kết quả của backend, lọc ở web rồi mới cắt trang, để `total` và số
   * trang phản ánh đúng kết quả SAU lọc (không phải tổng của backend).
   */
  async search(filters: ProductFilters, page = 1, pageSize = SEARCH_PAGE_SIZE): Promise<SearchResult> {
    const query = {
      search: filters.q,
      brand: filters.brands.length === 1 ? filters.brands[0] : undefined,
      minPrice: filters.min,
      maxPrice: filters.max,
      sort: SORT_TO_BACKEND[filters.sort],
    };
    const needsLocalFilter = filters.brands.length > 1 || filters.rams.length > 0 || filters.cpus.length > 0;
    const totalPagesOf = (total: number) => Math.max(1, Math.ceil(total / pageSize));

    if (!needsLocalFilter) {
      const res = await list({ ...query, page, limit: pageSize });
      return { items: res.items, total: res.total, page, totalPages: totalPagesOf(res.total) };
    }
    const all = await listEvery(query);
    const filtered = applyProductFilters(all.items, { ...filters, q: undefined, min: undefined, max: undefined });
    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, totalPages: totalPagesOf(filtered.length) };
  },

  getBySlug: (slug: string) => fetchDetail(slug, REVALIDATE),

  /**
   * Giá/tồn kho hiện tại theo id — dùng khi tính lại đơn ở server (mục 5), nên KHÔNG cache.
   * Id không tồn tại / ngừng bán bị bỏ qua.
   */
  async getManyByIds(ids: readonly string[]): Promise<Product[]> {
    const found = await Promise.all([...new Set(ids)].map((id) => fetchDetail(id, 0)));
    return found.filter((p): p is Product => p !== null);
  },
};
