// Nhãn + màu vai trò / trạng thái tài khoản (design/admin/07 §1.3).
import type { UserRole } from "./types";

type TagMeta = { label: string; color: string };

export const USER_ROLE_META: Record<UserRole, TagMeta> = {
  admin: { label: "Quản trị", color: "blue" },
  user: { label: "Khách hàng", color: "default" },
};

export const USER_STATUS_META: Record<"active" | "locked", TagMeta> = {
  active: { label: "Hoạt động", color: "green" },
  locked: { label: "Bị khoá", color: "red" },
};

/** Vai trò lạ do backend trả → hiện nguyên giá trị, màu xám (không làm sập bảng). */
export function userRoleMeta(role: string): TagMeta {
  return role === "admin" || role === "user" ? USER_ROLE_META[role] : { label: role, color: "default" };
}

export function userStatusMeta(isActive: boolean): TagMeta {
  return USER_STATUS_META[isActive ? "active" : "locked"];
}
