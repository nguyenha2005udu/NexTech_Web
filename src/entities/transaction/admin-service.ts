import "server-only";
import { apiFetch } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import type { AdminPaymentDetail, AdminPaymentListItem, AdminPaymentListQuery } from "./types";

// FDD 8.2.4–8.2.5 — Giao dịch phía quản trị (design/admin/06 §5). Gateway: /api/admin/payments → order-service,
// yêu cầu vai trò admin. Xác nhận COD nằm ở Server Action `features/admin/transactions/actions.ts`.
// Cột `amount` là `bigint` → order-service trả chuỗi (`"130000"`) → đổi sang number tại đây.

type Amount = string | number;
type RawListItem = Omit<AdminPaymentListItem, "amount"> & { amount: Amount };
type RawDetail = Omit<AdminPaymentDetail, "amount"> & { amount: Amount };

const toAmount = (value: Amount | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toListItem = (raw: RawListItem): AdminPaymentListItem => ({
  id: raw.id,
  order_id: raw.order_id,
  method: raw.method,
  amount: toAmount(raw.amount),
  status: raw.status,
  paid_at: raw.paid_at ?? null,
});

export const adminPaymentService = {
  async list(query: AdminPaymentListQuery = {}): Promise<Paginated<AdminPaymentListItem>> {
    const page = await apiFetch<Paginated<RawListItem>>(`/api/admin/payments${toQueryString({ ...query })}`);
    return { ...page, items: page.items.map(toListItem) };
  },

  async get(id: string): Promise<AdminPaymentDetail> {
    const raw = await apiFetch<RawDetail>(`/api/admin/payments/${encodeURIComponent(id)}`);
    return {
      ...toListItem(raw),
      transaction_id: raw.transaction_id ?? null,
      currency: raw.currency || "VND",
    };
  },
};
