// FDD 8.4 — Logic thuần của màn Người dùng (design/admin/07 §1, §3). Không gọi API, không biết UI.
import { USER_ROLE_META, USER_STATUS_META, type AdminUserListQuery, type UserRole } from "@/entities/user";
import { userIdSchema } from "./schemas";

export const USER_PAGE_SIZE = 20;

const USER_ROLES: readonly UserRole[] = ["user", "admin"];
type StatusParam = keyof typeof USER_STATUS_META;
const STATUS_PARAMS: readonly StatusParam[] = ["active", "locked"];

/** Ô lọc / ô chọn vai trò (§1.2, §3.2). */
export const USER_ROLE_OPTIONS: ReadonlyArray<{ value: UserRole; label: string }> = USER_ROLES.map((value) => ({
  value,
  label: USER_ROLE_META[value].label,
}));

/** Ô lọc trạng thái (§1.2): `?status=active|locked`. */
export const USER_STATUS_OPTIONS: ReadonlyArray<{ value: StatusParam; label: string }> = STATUS_PARAMS.map(
  (value) => ({ value, label: USER_STATUS_META[value].label }),
);

/** Admin không được tự khoá / tự đổi vai trò của mình (✅Q-U3 — backend chưa chặn, BE-11). */
export const isSelf = (userId: string, currentUserId: string): boolean => userId === currentUserId;

export const SELF_UPDATE_MESSAGE = "Không thể tự thay đổi vai trò hoặc khoá tài khoản của mình";

type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** `?q=&role=&status=&page=` trên URL → tham số `GET /api/admin/users`. Giá trị lạ bị bỏ qua (backend trả 400). */
export function parseUserListParams(
  sp: RawSearchParams,
): Required<Pick<AdminUserListQuery, "page" | "limit">> & AdminUserListQuery {
  const search = first(sp.q)?.trim().slice(0, 100);
  const rawRole = first(sp.role);
  const rawStatus = first(sp.status);
  const status = STATUS_PARAMS.find((s) => s === rawStatus);
  const page = Number(first(sp.page));
  return {
    search: search || undefined,
    role: USER_ROLES.find((r) => r === rawRole),
    is_active: status === undefined ? undefined : status === "active" ? "true" : "false",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: USER_PAGE_SIZE,
  };
}

/** `?view=<uuid>` → id người dùng cần mở Drawer; sai định dạng → `null` (không gọi API). */
export function parseUserView(sp: RawSearchParams): string | null {
  const view = first(sp.view);
  return view && userIdSchema.safeParse(view).success ? view : null;
}
