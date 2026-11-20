// Sản phẩm phía quản trị (FDD 7.2, design/admin/03 §3–4) — shape đúng body catalog-service (snake_case).
// Đã gọi thử 2026-11-20: `price` là chuỗi decimal ("800000") → admin-service đổi sang number trước khi trả.

export type AdminProductSort = "price_asc" | "price_desc" | "rating_desc" | "newest";

/** Một dòng của `GET /api/admin/products` (sau khi đổi `price` sang number). */
export interface AdminProductListItem {
  id: string;
  name: string;
  /** Tên danh mục. */
  category: string | null;
  brand: string | null;
  price: number;
  /** Chuỗi decimal "4.9" hoặc null khi chưa có đánh giá. */
  rating: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  thumbnail: string | null;
}

export interface AdminProductQuery {
  search?: string;
  categoryId?: string;
  brand?: string;
  isActive?: boolean;
  sort?: AdminProductSort;
  page?: number;
  /** Backend giới hạn 1–100, mặc định 20. */
  limit?: number;
}

export interface AdminProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface AdminProductSpec {
  id: string;
  spec_key: string;
  spec_value: string;
  spec_unit: string | null;
}

export interface AdminProductTag {
  id: string;
  name: string;
}

/** Đủ dữ liệu cho 4 tab của modal sửa. */
export interface AdminProductDetail {
  id: string;
  name: string;
  category_id: string | null;
  brand: string | null;
  price: number;
  description: string | null;
  stock_quantity: number;
  is_active: boolean;
  images: AdminProductImage[];
  specs: AdminProductSpec[];
  tags: AdminProductTag[];
}

/**
 * Dữ liệu cho modal sửa (✅Q-P4, design/admin/03 §2.7). Backend chưa có `GET /api/admin/products/:id` (BE-1):
 * - `partial: false` — lấy được từ API công khai (SP đang bán), đủ 4 tab.
 * - `partial: true`  — SP ngừng bán: chỉ có dữ liệu dòng danh sách, không có danh mục/mô tả/ảnh/thông số/tag.
 */
export type AdminProductEditData =
  | { partial: false; product: AdminProductDetail }
  | { partial: true; product: AdminProductListItem };

/** Body thêm / sửa (`CreateProductDto` / `UpdateProductDto`). Sửa có thể chỉ gửi một phần. */
export interface ProductPayload {
  name?: string;
  category_id?: string;
  brand?: string;
  price?: number;
  description?: string;
  stock_quantity?: number;
  is_active?: boolean;
}
