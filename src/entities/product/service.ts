import "server-only";
import { ApiError, apiFetchPublic } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import { applyProductFilters } from "./filters";
import type { Product, ProductFilters, ProductSort, ProductTag } from "./types";

// FDD 2.x — Sản phẩm phía khách. Gọi `GET /api/products[/:id]` của catalog-service (công khai, ISR 60 s).
// Backend không có `slug`: dùng `id` làm `slug` trong URL (`/products/<id>`).

const REVALIDATE = 60;
const PAGE_LIMIT = 100;
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

async function list(query: Record<string, string | number | undefined>): Promise<Paginated<Product>> {
  const page = await apiFetchPublic<Paginated<RawListItem>>(
    `/api/products${toQueryString({ limit: PAGE_LIMIT, ...query })}`,
    REVALIDATE,
  );
  return { ...page, items: page.items.map(fromListItem) };
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

  async search(filters: ProductFilters): Promise<{ items: Product[]; total: number }> {
    const page = await list({
      search: filters.q,
      // Backend chỉ lọc 1 hãng; nhiều hãng thì lọc tiếp ở dưới.
      brand: filters.brands.length === 1 ? filters.brands[0] : undefined,
      minPrice: filters.min,
      maxPrice: filters.max,
      sort: SORT_TO_BACKEND[filters.sort],
    });
    // Backend chưa có lọc RAM/CPU → lọc phía web trên kết quả đã lấy.
    const items = applyProductFilters(page.items, { ...filters, q: undefined, min: undefined, max: undefined });
    return { items, total: page.total };
  },

  async getBySlug(slug: string): Promise<Product | null> {
    try {
      return fromDetail(await apiFetchPublic<RawDetail>(`/api/products/${encodeURIComponent(slug)}`, REVALIDATE));
    } catch (err) {
      // 404: không có / ngừng bán. 400: id sai định dạng.
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
      throw err;
    }
  },
};
