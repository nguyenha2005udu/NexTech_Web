import "server-only";
import { apiFetch } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import type { AdminOrderDetail, AdminOrderListItem, AdminOrderListQuery, AdminOrderPayment } from "./types";

// FDD 8.2 — Đơn hàng phía quản trị (design/admin/04 §4). Gateway yêu cầu vai trò admin.
// Đổi trạng thái nằm ở Server Action `features/admin/orders/actions.ts`.
// order-service trả cột tiền `bigint` dạng chuỗi (`"230000"`) → đổi sang number tại đây.

type Amount = string | number;
type RawListItem = Omit<AdminOrderListItem, "total"> & { total: Amount };
type RawPayment = Omit<AdminOrderPayment, "amount"> & { amount: Amount };
type RawDetail = Omit<
  AdminOrderDetail,
  "items" | "subtotal" | "shipping_fee" | "discount_amount" | "total" | "payment"
> & {
  items: Array<{ product: { id: string; name: string; price: Amount }; quantity: number; product_image?: string | null }>;
  subtotal: Amount;
  shipping_fee: Amount;
  discount_amount: Amount;
  total: Amount;
  payment: RawPayment | null;
};

const toAmount = (value: Amount | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

function toDetail(raw: RawDetail): AdminOrderDetail {
  const { payment } = raw;
  return {
    ...raw,
    items: raw.items.map((line) => ({
      ...line,
      product: { ...line.product, price: toAmount(line.product.price) },
    })),
    subtotal: toAmount(raw.subtotal),
    shipping_fee: toAmount(raw.shipping_fee),
    discount_amount: toAmount(raw.discount_amount),
    total: toAmount(raw.total),
    payment: payment && {
      id: payment.id,
      method: payment.method,
      status: payment.status,
      amount: toAmount(payment.amount),
      paid_at: payment.paid_at,
    },
  };
}

export const adminOrderService = {
  async list(query: AdminOrderListQuery = {}): Promise<Paginated<AdminOrderListItem>> {
    const page = await apiFetch<Paginated<RawListItem>>(`/api/admin/orders${toQueryString({ ...query })}`);
    return { ...page, items: page.items.map((o) => ({ ...o, total: toAmount(o.total) })) };
  },

  async get(id: string): Promise<AdminOrderDetail> {
    return toDetail(await apiFetch<RawDetail>(`/api/admin/orders/${encodeURIComponent(id)}`));
  },
};
