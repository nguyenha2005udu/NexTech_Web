// FDD 8.3 — Logic thuần của màn mã giảm giá (design/admin/05). Không gọi API, không biết UI.
import type { AdminCoupon, AdminCouponQuery, CouponStatus } from "@/entities/coupon";
import { formatNumber } from "@/lib/format";
import { couponIdSchema, type CouponFormInput } from "./schemas";

export const COUPON_PAGE_SIZE = 20;

/** Ô lọc trạng thái — đúng 2 giá trị backend lọc được ("Tạm dừng" gồm cả hết hạn / chưa bắt đầu). */
export const COUPON_STATUS_OPTIONS: ReadonlyArray<{ value: CouponStatus; label: string }> = [
  { value: "running", label: "Đang chạy" },
  { value: "paused", label: "Tạm dừng" },
];

type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** `?q=&status=&page=` → tham số `GET /api/admin/discount-codes`. Giá trị lạ bị bỏ qua. */
export function parseCouponListParams(
  sp: RawSearchParams,
): Required<Pick<AdminCouponQuery, "page" | "limit">> & AdminCouponQuery {
  const search = first(sp.q)?.trim().slice(0, 50) || undefined;
  const rawStatus = first(sp.status);
  const status = COUPON_STATUS_OPTIONS.find((o) => o.value === rawStatus)?.value;
  const page = Number(first(sp.page));
  return {
    search,
    status,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: COUPON_PAGE_SIZE,
  };
}

export type CouponModalState = { mode: "create" } | { mode: "edit"; id: string };

/** `?modal=create` hoặc `?modal=edit&id=<uuid>`; sai định dạng → không mở. */
export function parseCouponModal(sp: RawSearchParams): CouponModalState | null {
  const modal = first(sp.modal);
  if (modal === "create") return { mode: "create" };
  const id = first(sp.id);
  if (modal === "edit" && id && couponIdSchema.safeParse(id).success) return { mode: "edit", id };
  return null;
}

// ===== Hiển thị bảng =====

/** `10%` / `50.000₫` (đúng mockup, không khoảng trắng trước ₫). */
export function formatCouponValue(coupon: Pick<AdminCoupon, "discount_type" | "discount_value">): string {
  return coupon.discount_type === "percent"
    ? `${formatNumber(coupon.discount_value)}%`
    : `${formatNumber(coupon.discount_value)}₫`;
}

/** `124/500`; không giới hạn → `124/∞`. */
export function formatCouponUsage(coupon: Pick<AdminCoupon, "used_count" | "usage_limit">): string {
  const limit = coupon.usage_limit === null ? "∞" : formatNumber(coupon.usage_limit);
  return `${formatNumber(coupon.used_count)}/${limit}`;
}

// ===== Ngày theo giờ Việt Nam =====

const vnDateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** ISO → "YYYY-MM-DD" theo giờ Việt Nam (ngày hiển thị trên lịch). */
export function toVNDate(iso: string): string {
  return vnDateFormatter.format(new Date(iso));
}

// ===== Giá trị form =====

/** Giá trị form, ngày dạng "YYYY-MM-DD" — component đổi sang/từ Dayjs của RangePicker. */
export type CouponFormValues = Omit<CouponFormInput, "discountValue" | "maxDiscount" | "minOrderValue" | "usageLimit"> & {
  /** Trống khi thêm mới (ô hiện placeholder). */
  discountValue?: number | null;
  maxDiscount?: number | null;
  minOrderValue?: number | null;
  usageLimit?: number | null;
};

export function emptyCouponValues(): CouponFormValues {
  return {
    code: "",
    description: "",
    category: "order",
    discountType: "percent",
    discountValue: null,
    isActive: true,
  };
}

/** Dòng trên bảng → giá trị form sửa (✅Q-CP5: không có API chi tiết). */
export function toCouponFormValues(coupon: AdminCoupon): CouponFormValues {
  return {
    code: coupon.code,
    description: coupon.description ?? "",
    category: coupon.category,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    maxDiscount: coupon.max_discount,
    minOrderValue: coupon.min_order_value,
    usageLimit: coupon.usage_limit,
    validFrom: coupon.valid_from ? toVNDate(coupon.valid_from) : undefined,
    validUntil: coupon.valid_until ? toVNDate(coupon.valid_until) : undefined,
    isActive: coupon.is_active,
  };
}

/**
 * Lỗi của ô "Thời gian hiệu lực" khi sửa: backend không xoá được ngày đã đặt (gửi `null` thành 01/01/1970).
 * Trả `null` khi hợp lệ.
 */
export function clearedDateError(
  initial: Pick<CouponFormValues, "validFrom" | "validUntil">,
  next: Pick<CouponFormValues, "validFrom" | "validUntil">,
): string | null {
  if ((initial.validFrom && !next.validFrom) || (initial.validUntil && !next.validUntil)) {
    return "Không bỏ được ngày đã đặt — hãy chọn ngày khác";
  }
  return null;
}

/** Sửa: giới hạn lượt không nhỏ hơn số lượt đã dùng (backend không kiểm). */
export function usageLimitError(limit: number | null | undefined, usedCount: number): string | null {
  return typeof limit === "number" && limit < usedCount ? `Đã dùng ${formatNumber(usedCount)} lượt — giới hạn phải lớn hơn hoặc bằng` : null;
}
