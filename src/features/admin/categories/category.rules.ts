// FDD 7.1 — Logic thuần của màn danh mục (design/admin/02). Không gọi API, không biết UI.
import type { AdminCategory, AdminCategoryQuery } from "@/entities/category";
import { categoryIdSchema, type CategoryFormValues } from "./schemas";

export const CATEGORY_PAGE_SIZE = 20;
/** Số danh mục tối đa lấy về để tính thứ tự mặc định (backend cho `limit` ≤ 100). */
export const SORT_ORDER_SAMPLE = 100;

export type CategoryStatusFilter = "active" | "hidden";

export const CATEGORY_STATUS_OPTIONS: ReadonlyArray<{ value: CategoryStatusFilter; label: string }> = [
  { value: "active", label: "Hiển thị" },
  { value: "hidden", label: "Ẩn" },
];

/**
 * Thứ tự mặc định khi thêm (✅Q-C4): `max(sortOrder) + 1` trên danh sách đã lấy.
 * Nếu backend còn danh mục chưa lấy hết (`total > items.length`) thì dùng `total + 1`.
 */
export function nextSortOrder(items: ReadonlyArray<Pick<AdminCategory, "sortOrder">>, total: number): number {
  if (total > items.length) return total + 1;
  if (items.length === 0) return 1;
  return Math.max(...items.map((c) => c.sortOrder)) + 1;
}

/** Icon là URL ảnh (`http://` / `https://`) → hiện ảnh; còn lại (emoji, chữ) hiện nguyên. */
export function isImageIcon(icon: string | null | undefined): boolean {
  return typeof icon === "string" && /^https?:\/\//i.test(icon.trim());
}

type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** `?q=&status=&page=` trên URL → tham số gọi `GET /api/admin/categories`. Giá trị lạ bị bỏ qua. */
export function parseCategoryListParams(sp: RawSearchParams): Required<Pick<AdminCategoryQuery, "page" | "limit">> &
  AdminCategoryQuery {
  const search = first(sp.q)?.trim().slice(0, 100) || undefined;
  const status = first(sp.status);
  const isActive = status === "active" ? true : status === "hidden" ? false : undefined;
  const page = Number(first(sp.page));
  return {
    search,
    isActive,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: CATEGORY_PAGE_SIZE,
  };
}

export type CategoryModalState = { mode: "create" } | { mode: "edit"; id: string };

/** `?modal=create` hoặc `?modal=edit&id=<uuid>` → trạng thái modal; sai định dạng → không mở. */
export function parseCategoryModal(sp: RawSearchParams): CategoryModalState | null {
  const modal = first(sp.modal);
  if (modal === "create") return { mode: "create" };
  const id = first(sp.id);
  if (modal === "edit" && id && categoryIdSchema.safeParse(id).success) return { mode: "edit", id };
  return null;
}

/** Giá trị đổ sẵn vào form sửa. */
export function toFormValues(category: AdminCategory): CategoryFormValues {
  return {
    name: category.name,
    icon: category.icon ?? "",
    sortOrder: category.sortOrder,
    industryId: category.industry_id ?? undefined, // undefined để Select hiện placeholder
    isActive: category.isActive,
  };
}

/** Giá trị mặc định của form thêm. */
export function emptyFormValues(sortOrder: number): CategoryFormValues {
  return { name: "", icon: "", sortOrder, industryId: undefined, isActive: true };
}
