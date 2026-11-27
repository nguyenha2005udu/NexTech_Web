// Chỉ export type + hằng (dùng được ở client). Service ở server: import từ "@/entities/user/service"
// (hồ sơ của mình) hoặc "@/entities/user/admin-service" (quản trị).
export type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUserListQuery,
  MyProfile,
  ShoppingProfile,
  UserAccount,
  UserRole,
} from "./types";
export { USER_ROLE_META, USER_STATUS_META, userRoleMeta, userStatusMeta } from "./status";
