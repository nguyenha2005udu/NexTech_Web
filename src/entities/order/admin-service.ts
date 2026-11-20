import "server-only";
import { apiFetch } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import type { AdminOrderListItem, AdminOrderListQuery } from "./types";

// FDD 8.2 — Đơn hàng phía quản trị (design/admin/04 §4). Gateway yêu cầu vai trò admin.
export const adminOrderService = {
  list: (query: AdminOrderListQuery = {}) =>
    apiFetch<Paginated<AdminOrderListItem>>(`/api/admin/orders${toQueryString({ ...query })}`),
};
