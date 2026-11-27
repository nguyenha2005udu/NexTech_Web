// FDD 8.4 — Quản lý người dùng (design/admin/07). SSR: danh sách theo ?q=&role=&status=&page=,
// Drawer chi tiết theo ?view=<userId>. Khoá / đổi vai trò là Server Action (quyền user:manage).
import type { Metadata } from "next";
import { Card } from "antd";
import type { AdminUserDetail } from "@/entities/user";
import { adminUserService } from "@/entities/user/admin-service";
import { UserDetail, UserTable, UserToolbar, parseUserListParams, parseUserView } from "@/features/admin/users";
import { ApiError } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Quản lý người dùng" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Chi tiết cho Drawer. Không tìm thấy (404 NT-IDN-1003) → `null` (Drawer báo "Không tìm thấy người dùng"). */
async function loadDetail(id: string | null): Promise<AdminUserDetail | null> {
  if (!id) return null;
  return adminUserService.get(id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const me = await requirePermission("user:manage");

  const sp = await searchParams;
  const query = parseUserListParams(sp);
  const viewId = parseUserView(sp);
  const [list, detail] = await Promise.all([adminUserService.list(query), loadDetail(viewId)]);

  return (
    <>
      <UserToolbar />
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <UserTable
          items={list.items}
          total={list.total}
          page={query.page}
          pageSize={query.limit}
          currentUserId={me.id}
        />
      </Card>
      <UserDetail
        key={detail ? `${detail.id}-${detail.role}-${detail.is_active}` : "none"}
        user={detail}
        currentUserId={me.id}
        notFound={viewId !== null && detail === null}
      />
    </>
  );
}
