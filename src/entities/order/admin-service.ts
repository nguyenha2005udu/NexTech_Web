import "server-only";
import { apiFetch } from "@/lib/api/http";
import type { Paginated } from "@/types/api";
import type { AdminOrderListItem, AdminOrderListQuery } from "./types";

// FDD 8.2 — Đơn hàng phía quản trị (design/admin/04 §4). Gateway yêu cầu vai trò admin.

function toQueryString(query: AdminOrderListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const adminOrderService = {
  list: (query: AdminOrderListQuery = {}) =>
    apiFetch<Paginated<AdminOrderListItem>>(`/api/admin/orders${toQueryString(query)}`),
};
