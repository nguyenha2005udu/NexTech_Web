// FDD 7.2 — Logic thuần của màn sản phẩm (design/admin/03). Không gọi API, không biết UI.
import type { AdminProductDetail, AdminProductListItem, AdminProductQuery, AdminProductSort } from "@/entities/product";
import { productIdSchema, type ProductBasicValues } from "./schemas";

/** Giá trị trong form tab cơ bản — có thể thiếu trường (ô giá còn trống). */
export type ProductBasicFormValues = Partial<ProductBasicValues>;

/** Tồn kho ≤ ngưỡng này hiện đỏ (✅Q-P1). */
export const LOW_STOCK_THRESHOLD = 5;
export const PRODUCT_PAGE_SIZES = [20, 50, 100] as const;

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(quantity: number): StockLevel {
  if (quantity <= 0) return "out";
  return quantity <= LOW_STOCK_THRESHOLD ? "low" : "ok";
}

// ===== Sắp xếp qua tiêu đề cột (✅Q-P5) =====
export type SortableColumn = "price" | "rating";
export type ColumnSortOrder = "ascend" | "descend" | null;

const SORTS: readonly AdminProductSort[] = ["price_asc", "price_desc", "rating_desc", "newest"];

/** Cột + chiều antd → `?sort=`. Bỏ sắp xếp → `undefined` (backend mặc định `newest`). RATING chỉ có giảm dần. */
export function sortFromTable(column: SortableColumn | undefined, order: ColumnSortOrder): AdminProductSort | undefined {
  if (!column || !order) return undefined;
  if (column === "price") return order === "ascend" ? "price_asc" : "price_desc";
  return "rating_desc";
}

/** `?sort=` → chiều đang sắp của một cột (cho `sortOrder` có kiểm soát của antd Table). */
export function columnSortOrder(sort: AdminProductSort | undefined, column: SortableColumn): ColumnSortOrder {
  if (column === "price") return sort === "price_asc" ? "ascend" : sort === "price_desc" ? "descend" : null;
  return sort === "rating_desc" ? "descend" : null;
}

// ===== URL =====
type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const isId = (value: string | undefined): value is string => !!value && productIdSchema.safeParse(value).success;

/** `?q&category&brand&sort&page&size` → tham số `GET /api/admin/products`. Giá trị lạ bị bỏ qua. */
export function parseProductListParams(
  sp: RawSearchParams,
): AdminProductQuery & Required<Pick<AdminProductQuery, "page" | "limit">> {
  const sort = first(sp.sort);
  const page = Number(first(sp.page));
  const size = Number(first(sp.size));
  const category = first(sp.category);
  return {
    search: first(sp.q)?.trim().slice(0, 255) || undefined,
    categoryId: isId(category) ? category : undefined,
    brand: first(sp.brand)?.trim().slice(0, 100) || undefined,
    sort: SORTS.includes(sort as AdminProductSort) ? (sort as AdminProductSort) : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: (PRODUCT_PAGE_SIZES as readonly number[]).includes(size) ? size : PRODUCT_PAGE_SIZES[0],
  };
}

export type ProductModalState = { mode: "create" } | { mode: "edit"; id: string };

export function parseProductModal(sp: RawSearchParams): ProductModalState | null {
  const modal = first(sp.modal);
  if (modal === "create") return { mode: "create" };
  const id = first(sp.id);
  return modal === "edit" && isId(id) ? { mode: "edit", id } : null;
}

// ===== Giá trị form tab "Thông tin cơ bản" =====

/** Thêm mới: danh mục mặc định là danh mục đầu tiên (ảnh 05: "Laptop"). */
export function emptyBasicValues(firstCategoryId: string | undefined): ProductBasicFormValues {
  return {
    name: "",
    categoryId: firstCategoryId,
    brand: "",
    price: undefined, // ô trống — zod báo "Vui lòng nhập giá"
    description: "",
    stockQuantity: 0,
    isActive: true,
  };
}

export function detailToBasicValues(p: AdminProductDetail): ProductBasicFormValues {
  return {
    name: p.name,
    categoryId: p.category_id ?? undefined,
    brand: p.brand ?? "",
    price: p.price,
    description: p.description ?? "",
    stockQuantity: p.stock_quantity,
    isActive: p.is_active,
  };
}

/** SP ngừng bán (§2.7): chỉ có dữ liệu dòng list — danh mục, mô tả để trống. */
export function rowToBasicValues(p: AdminProductListItem): ProductBasicFormValues {
  return {
    name: p.name,
    categoryId: undefined,
    brand: p.brand ?? "",
    price: p.price,
    description: "",
    stockQuantity: p.stock_quantity,
    isActive: p.is_active,
  };
}

/** Chỉ giữ trường khác giá trị ban đầu — để không ghi đè danh mục / mô tả chưa tải được thành rỗng. */
export function changedFields(initial: ProductBasicFormValues, values: ProductBasicFormValues): ProductBasicFormValues {
  const changed: Record<string, unknown> = {};
  for (const key of Object.keys(values) as Array<keyof ProductBasicValues>) {
    const before = initial[key] ?? "";
    const after = values[key] ?? "";
    if (before !== after) changed[key] = values[key];
  }
  return changed as ProductBasicFormValues;
}
