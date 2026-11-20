export type CategoryIconKey =
  | "laptop"
  | "monitor"
  | "keyboard"
  | "cpu"
  | "device"
  | "sparkle"
  | "storage"
  | "network";

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: CategoryIconKey;
  /** Tiêu đề trang danh mục (FDD 2.1) — mặc định dùng `name` */
  title?: string;
  description?: string;
}

// ===== Khu quản trị (FDD 7.1, design/admin/02 §3–4) — shape đúng body catalog-service =====
// Tên field trộn camelCase (`sortOrder`, `isActive`, `createdAt`) với snake_case (`industry_id`) — giữ đúng backend.

/** Một danh mục ở `GET /api/admin/categories` và `GET /api/admin/categories/:id`. */
export interface AdminCategory {
  id: string;
  name: string;
  /** Emoji hoặc URL ảnh; có thể là "" nếu từng lưu chuỗi rỗng. */
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  industry_id: string | null;
  /** Chỉ có ở danh sách; chi tiết trả kèm object `industry`. */
  industry_name?: string | null;
}

export interface AdminCategoryQuery {
  search?: string;
  isActive?: boolean;
  industryId?: string;
  page?: number;
  /** Backend giới hạn 1–100, mặc định 20. */
  limit?: number;
}

/** Ngành học — `GET /api/industries` (công khai). Chỉ khai báo trường web dùng. */
export interface Industry {
  id: string;
  name: string;
}

/** Body thêm / sửa danh mục (`CreateCategoryDto`). `null` = xoá giá trị cũ khi sửa. */
export interface CategoryPayload {
  name: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  industryId: string | null;
}
