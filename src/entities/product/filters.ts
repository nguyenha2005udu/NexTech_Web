import type { Product, ProductFilters, ProductSort } from "./types";

// Logic thuần cho tìm/lọc/sắp xếp (FDD 2.2) — dùng chung cho server (search) và client (category).

export const SORT_OPTIONS: ReadonlyArray<{ value: ProductSort; label: string }> = [
  { value: "relevance", label: "Phù hợp" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
  { value: "rating", label: "Đánh giá cao" },
];

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((o) => o.value));

function isSort(value: string | undefined): value is ProductSort {
  return value !== undefined && SORT_VALUES.has(value);
}

function toList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).flatMap((v) => v.split(",")).filter(Boolean);
}

function toNumber(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseProductFilters(params: RawSearchParams): ProductFilters {
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim();
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  return {
    q: q || undefined,
    brands: toList(params.brand),
    rams: toList(params.ram),
    cpus: toList(params.cpu),
    min: toNumber(params.min),
    max: toNumber(params.max),
    sort: isSort(sort) ? sort : "relevance",
  };
}

export function serializeProductFilters(filters: ProductFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.brands.length) sp.set("brand", filters.brands.join(","));
  if (filters.rams.length) sp.set("ram", filters.rams.join(","));
  if (filters.cpus.length) sp.set("cpu", filters.cpus.join(","));
  if (filters.min !== undefined) sp.set("min", String(filters.min));
  if (filters.max !== undefined) sp.set("max", String(filters.max));
  if (filters.sort !== "relevance") sp.set("sort", filters.sort);
  return sp;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function matchesKeyword(product: Product, q: string): boolean {
  const haystack = normalize(
    [product.name, product.brand, product.categorySlug, product.summary, product.headline, product.tag].join(" "),
  );
  return normalize(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function applyProductFilters(products: readonly Product[], filters: ProductFilters): Product[] {
  const result = products.filter(
    (p) =>
      (!filters.q || matchesKeyword(p, filters.q)) &&
      (!filters.brands.length || filters.brands.includes(p.brand)) &&
      (!filters.rams.length || (p.ram !== undefined && filters.rams.includes(p.ram))) &&
      (!filters.cpus.length || (p.cpu !== undefined && filters.cpus.includes(p.cpu))) &&
      (filters.min === undefined || p.price >= filters.min) &&
      (filters.max === undefined || p.price <= filters.max),
  );

  switch (filters.sort) {
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);
    case "price-desc":
      return result.sort((a, b) => b.price - a.price);
    case "rating":
      return result.sort((a, b) => b.rating - a.rating);
    default:
      return result;
  }
}

export interface FilterFacets {
  brands: string[];
  rams: string[];
  cpus: string[];
}

/** Lấy các giá trị lọc có trong danh sách sản phẩm (để hiển thị checkbox). */
export function getFilterFacets(products: readonly Product[]): FilterFacets {
  const uniq = (values: Array<string | undefined>) =>
    [...new Set(values.filter((v): v is string => Boolean(v)))];
  return {
    brands: uniq(products.map((p) => p.brand)),
    rams: uniq(products.map((p) => p.ram)).sort(),
    cpus: uniq(products.map((p) => p.cpu)),
  };
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.brands.length > 0 ||
    filters.rams.length > 0 ||
    filters.cpus.length > 0 ||
    filters.min !== undefined ||
    filters.max !== undefined
  );
}
