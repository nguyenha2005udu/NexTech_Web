import "server-only";
import { apiFetch } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import type { AdminUserDetail, AdminUserListItem, AdminUserListQuery } from "./types";

// FDD 8.4 — Người dùng phía quản trị (design/admin/07 §4). Gateway: /api/admin/users → identity-service,
// yêu cầu vai trò admin. Khoá / đổi vai trò nằm ở Server Action `features/admin/users/actions.ts`.
// Danh sách của identity trả `{ data, total, page, limit }` (khác quy ước `Paginated`) → đổi tại đây.

type RawList = { data: AdminUserListItem[]; total: number; page: number; limit: number };
type RawDetail = Omit<AdminUserDetail, "profile"> & {
  profile: (Omit<NonNullable<AdminUserDetail["profile"]>, "interests"> & { interests: string[] | null }) | null;
};

const toListItem = (raw: AdminUserListItem): AdminUserListItem => ({
  id: raw.id,
  full_name: raw.full_name,
  email: raw.email ?? null,
  phone_number: raw.phone_number ?? null,
  avatar_url: raw.avatar_url ?? null,
  role: raw.role,
  is_active: raw.is_active,
  created_at: raw.created_at,
});

export const adminUserService = {
  async list(query: AdminUserListQuery = {}): Promise<Paginated<AdminUserListItem>> {
    const raw = await apiFetch<RawList>(`/api/admin/users${toQueryString({ ...query })}`);
    const limit = raw.limit > 0 ? raw.limit : 1;
    return {
      items: raw.data.map(toListItem),
      total: raw.total,
      page: raw.page,
      limit: raw.limit,
      totalPages: Math.ceil(raw.total / limit),
    };
  },

  async get(id: string): Promise<AdminUserDetail> {
    const raw = await apiFetch<RawDetail>(`/api/admin/users/${encodeURIComponent(id)}`);
    return {
      ...toListItem(raw),
      profile: raw.profile ? { ...raw.profile, interests: raw.profile.interests ?? [] } : null,
    };
  },
};
