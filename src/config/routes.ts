// Hằng số đường dẫn — không hard-code chuỗi route rải rác (mục 3.5).
export const routes = {
  home: "/",
  search: "/search",
  category: (slug: string) => `/categories/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  assistant: "/assistant",
  assistantHistory: "/assistant/history",
  assistantConversation: (id: string) => `/assistant/${id}`,
  cart: "/cart",
  profile: "/account/profile",
  checkout: "/checkout",
  /** "Mua ngay" (FDD 4.1.1): đặt riêng 1 sản phẩm, không đụng tới giỏ */
  checkoutBuyNow: (slug: string, quantity: number) =>
    `/checkout?${new URLSearchParams({ buyNow: slug, qty: String(quantity) }).toString()}`,
  notifications: "/account/notifications",
  priceAlerts: "/account/price-alerts",
  orderLookup: "/account/orders",
  login: "/login",
  /** Đăng nhập xong quay về `callbackUrl` (LoginForm đọc tham số này) */
  loginWithCallback: (callbackUrl: string) => `/login?${new URLSearchParams({ callbackUrl }).toString()}`,
  register: "/register",
  forgotPassword: "/forgot-password",
  forbidden: "/403",
  /** Khu quản trị (FDD 7, 8) — design/admin/00 §4.4 */
  admin: {
    dashboard: "/admin",
    categories: "/admin/categories",
    products: "/admin/products",
    orders: "/admin/orders",
    coupons: "/admin/coupons",
    transactions: "/admin/transactions",
    users: "/admin/users",
  },
} as const;
