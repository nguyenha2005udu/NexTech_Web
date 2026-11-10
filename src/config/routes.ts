// Hằng số đường dẫn — không hard-code chuỗi route rải rác (mục 3.5).
export const routes = {
  home: "/",
  search: "/search",
  category: (slug: string) => `/categories/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  assistant: "/assistant",
  cart: "/cart",
  notifications: "/account/notifications",
  priceAlerts: "/account/price-alerts",
  orderLookup: "/account/orders",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  forbidden: "/403",
} as const;
