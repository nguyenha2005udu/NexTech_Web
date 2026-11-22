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
