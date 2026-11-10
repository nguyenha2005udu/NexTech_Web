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
