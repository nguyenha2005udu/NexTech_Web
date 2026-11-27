// FDD 1.2.1 — Hồ sơ người dùng. Khớp identity-service: GET /api/users/me và GET /api/users/me/profile.

/** Thông tin tài khoản (`/api/users/me`). `phone_number` và `avatar_url` có thể `null`. */
export interface UserAccount {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
}

/** Hồ sơ mua sắm (`/api/users/me/profile`) — AI dùng để gợi ý. Chưa có bản ghi thì backend trả toàn `null` / `[]`. */
export interface ShoppingProfile {
  user_segment: string | null;
  occupation: string | null;
  age_range: string | null;
  interests: string[];
}

/** Gộp 2 nguồn trên để đổ vào form hồ sơ. */
export interface MyProfile {
  account: UserAccount;
  shopping: ShoppingProfile;
}

// FDD 8.4 — Người dùng phía quản trị (design/admin/07 §4). Khớp identity-service: GET /api/admin/users[/:id].

export type UserRole = "user" | "admin";

/** Một dòng danh sách `GET /api/admin/users`. `email` có thể `null` (tài khoản tạo bằng SĐT). */
export interface AdminUserListItem {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

/** `GET /api/admin/users/:id`: thêm hồ sơ mua sắm, `null` khi người dùng chưa khai báo. */
export interface AdminUserDetail extends AdminUserListItem {
  profile: ShoppingProfile | null;
}

/** Tham số `GET /api/admin/users`. `is_active` gửi dạng chuỗi (`IsBooleanString` ở backend). */
export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  is_active?: "true" | "false";
}
