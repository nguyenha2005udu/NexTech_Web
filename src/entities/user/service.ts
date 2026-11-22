import "server-only";
import { apiFetch } from "@/lib/api/http";
import type { MyProfile, ShoppingProfile, UserAccount } from "./types";

// FDD 1.2.1 — đọc hồ sơ của chính người đang đăng nhập. Gateway gắn danh tính từ cookie phiên,
// web không gửi userId. Ghi nằm ở Server Action `features/profile/actions.ts`.
export const userService = {
  async getMine(): Promise<MyProfile> {
    const [account, shopping] = await Promise.all([
      apiFetch<UserAccount>("/api/users/me"),
      apiFetch<ShoppingProfile>("/api/users/me/profile"),
    ]);
    return { account, shopping: { ...shopping, interests: shopping.interests ?? [] } };
  },
};
