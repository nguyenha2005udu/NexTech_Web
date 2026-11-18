// Mục 10.2 — Phân quyền RBAC, một nguồn sự thật duy nhất.
export type Role = "guest" | "user" | "admin";
export type Action =
  // Khách
  | "catalog:read"
  | "assistant:chat"
  | "cart:manage"
  // Người dùng
  | "profile:manage"
  | "assistant:history"
  | "order:create"
  | "order:own"
  | "review:create"
  | "price-alert:manage"
  | "notification:read"
  // Quản trị
  | "admin:access"
  | "stats:read"
  | "category:manage"
  | "product:manage"
  | "order:manage"
  | "transaction:read"
  | "payment:confirm-cod"
  | "coupon:manage"
  | "user:manage";

const guestActions: Action[] = ["catalog:read", "assistant:chat", "cart:manage"];
const userActions: Action[] = [
  ...guestActions,
  "profile:manage",
  "assistant:history",
  "order:create",
  "order:own",
  "review:create",
  "price-alert:manage",
  "notification:read",
];
const permissions: Record<Role, Action[]> = {
  guest: guestActions,
  user: userActions,
  admin: [
    ...userActions,
    "admin:access",
    "stats:read",
    "category:manage",
    "product:manage",
    "order:manage",
    "transaction:read",
    "payment:confirm-cod",
    "coupon:manage",
    "user:manage",
  ],
};

export const can = (role: Role, action: Action) => permissions[role].includes(action);
