import { routes } from "./routes";

// Menu khu quản trị — nguồn duy nhất cho Sidebar (nhãn, đường dẫn) và Header (tiêu đề trang).
// design/admin/00 §2.3. Mục "Người dùng" thêm theo Q-01 (mockup chưa có).

export type AdminNavKey = "dashboard" | "categories" | "products" | "orders" | "coupons" | "transactions" | "users";

export interface AdminNavItem {
  key: AdminNavKey;
  /** Nhãn trên menu */
  label: string;
  /** Tiêu đề trên header */
  title: string;
  href: string;
}

export const adminNav: readonly AdminNavItem[] = [
  { key: "dashboard", label: "Tổng quan", title: "Tổng quan", href: routes.admin.dashboard },
  { key: "categories", label: "Danh mục", title: "Quản lý danh mục", href: routes.admin.categories },
  { key: "products", label: "Sản phẩm", title: "Quản lý sản phẩm", href: routes.admin.products },
  { key: "orders", label: "Đơn hàng", title: "Quản lý đơn hàng", href: routes.admin.orders },
  { key: "coupons", label: "Mã giảm giá", title: "Mã giảm giá", href: routes.admin.coupons },
  { key: "transactions", label: "Thanh toán", title: "Quản lý thanh toán", href: routes.admin.transactions },
  { key: "users", label: "Người dùng", title: "Quản lý người dùng", href: routes.admin.users },
];

/** Mục menu khớp pathname: khớp đúng hoặc là trang con; "/admin" chỉ khớp chính nó. */
export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return adminNav.find((item) =>
    item.href === routes.admin.dashboard ? path === item.href : path === item.href || path.startsWith(`${item.href}/`),
  );
}
