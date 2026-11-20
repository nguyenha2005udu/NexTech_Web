export type { Product, ProductFilters, ProductImage, ProductSort, ProductSpec, ProductTag } from "./types";
export {
  SORT_OPTIONS,
  applyProductFilters,
  getFilterFacets,
  hasActiveFilters,
  parseProductFilters,
  serializeProductFilters,
} from "./filters";
export type { FilterFacets, RawSearchParams } from "./filters";
// Khu quản trị (FDD 7.2). Service ở server: import từ "@/entities/product/admin-service".
export type {
  AdminProductDetail,
  AdminProductEditData,
  AdminProductImage,
  AdminProductListItem,
  AdminProductQuery,
  AdminProductSort,
  AdminProductSpec,
  AdminProductTag,
  ProductPayload,
} from "./admin-types";
