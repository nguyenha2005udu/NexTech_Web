import "server-only";
import { apiFetch } from "@/lib/api/http";
import { toQueryString } from "@/lib/api/query-string";
import type { Paginated } from "@/types/api";
import type { AdminCoupon, AdminCouponQuery } from "./types";

// FDD 8.3 — Mã giảm giá phía quản trị (design/admin/05 §3). Gateway yêu cầu vai trò admin.
// Ghi (thêm / sửa / tạm dừng / kích hoạt) nằm ở Server Action `features/admin/coupons/actions.ts`.
// promotion-service trả cột `bigint` dạng chuỗi (`"60000"`) → đổi sang number tại đây (gọi thử 2026-11-20).

type Amount = string | number;
type RawCoupon = Omit<AdminCoupon, "discount_value" | "min_order_value" | "max_discount"> & {
  discount_value: Amount;
  min_order_value: Amount | null;
  max_discount: Amount | null;
};

const toNumber = (value: Amount): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const toNullableNumber = (value: Amount | null): number | null => (value === null ? null : toNumber(value));

export const adminCouponService = {
  async list(query: AdminCouponQuery = {}): Promise<Paginated<AdminCoupon>> {
    const page = await apiFetch<Paginated<RawCoupon>>(`/api/admin/discount-codes${toQueryString({ ...query })}`);
    return {
      ...page,
      items: page.items.map((c) => ({
        ...c,
        discount_value: toNumber(c.discount_value),
        min_order_value: toNullableNumber(c.min_order_value),
        max_discount: toNullableNumber(c.max_discount),
      })),
    };
  },
};
