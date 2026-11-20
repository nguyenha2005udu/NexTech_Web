import "server-only";
import { ApiError, apiFetch } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import type {
  AdminProductDetail,
  AdminProductEditData,
  AdminProductImage,
  AdminProductListItem,
  AdminProductQuery,
  AdminProductSpec,
  AdminProductTag,
} from "./admin-types";

// FDD 7.2 — Sản phẩm phía quản trị (design/admin/03 §3). Ghi nằm ở `features/admin/products/actions.ts`.

type RawListItem = Omit<AdminProductListItem, "price"> & { price: string | number };

/** Body chi tiết công khai `GET /api/products/:id` — chỉ khai báo trường dùng tới. */
interface RawPublicDetail {
  id: string;
  name: string;
  category_id: string | null;
  brand: string | null;
  price: string | number;
  description: string | null;
  stock_quantity: number;
  is_active: boolean;
  images?: AdminProductImage[];
  specs?: AdminProductSpec[];
  tags?: AdminProductTag[];
}

const toListItem = (raw: RawListItem): AdminProductListItem => ({ ...raw, price: Number(raw.price) });

/** Ảnh chính lên đầu, còn lại theo `sort_order` (giống thứ tự backend dùng cho thumbnail). */
const sortImages = (images: readonly AdminProductImage[]) =>
  [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);

function toDetail(raw: RawPublicDetail): AdminProductDetail {
  return {
    id: raw.id,
    name: raw.name,
    category_id: raw.category_id,
    brand: raw.brand,
    price: Number(raw.price),
    description: raw.description,
    stock_quantity: raw.stock_quantity,
    is_active: raw.is_active,
    images: sortImages(raw.images ?? []).map(({ id, image_url, is_primary, sort_order }) => ({
      id,
      image_url,
      is_primary,
      sort_order,
    })),
    specs: (raw.specs ?? []).map(({ id, spec_key, spec_value, spec_unit }) => ({ id, spec_key, spec_value, spec_unit })),
    tags: (raw.tags ?? []).map(({ id, name }) => ({ id, name })),
  };
}

const isNotFound = (err: unknown) => err instanceof ApiError && err.status === 404;

export const adminProductService = {
  async list(query: AdminProductQuery = {}): Promise<Paginated<AdminProductListItem>> {
    const page = await apiFetch<Paginated<RawListItem>>(`/api/admin/products${toQueryString({ ...query })}`);
    return { ...page, items: page.items.map(toListItem) };
  },

  brands: () => apiFetch<string[]>("/api/admin/products/brands"),

  /**
   * Dữ liệu modal sửa (§2.7, phương án tạm tới khi có BE-1): thử API công khai; 404 (SP ngừng bán) thì lấy dòng
   * trong `rows` (trang đang xem), không có thì tìm trong danh sách SP ngừng bán. Không thấy → `null`.
   */
  async getForEdit(id: string, rows: readonly AdminProductListItem[] = []): Promise<AdminProductEditData | null> {
    try {
      const raw = await apiFetch<RawPublicDetail>(`/api/products/${encodeURIComponent(id)}`);
      return { partial: false, product: toDetail(raw) };
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
    const row =
      rows.find((r) => r.id === id) ??
      (await this.list({ isActive: false, limit: 100 })).items.find((r) => r.id === id);
    return row ? { partial: true, product: row } : null;
  },
};
