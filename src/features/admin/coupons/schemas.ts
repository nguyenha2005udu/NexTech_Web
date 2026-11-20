// FDD 8.3 — zod của form mã giảm giá (design/admin/05 §2.2, §4). Dùng chung cho Form.Item (zodRule) và Server Action.
// Ngày đi qua form dạng "YYYY-MM-DD" (giờ Việt Nam); action đổi sang ISO đầu / cuối ngày khi gửi backend.
import { z } from "zod";

export const couponIdSchema = z.uuid("Mã giảm giá không hợp lệ");

export const couponCodeSchema = z
  .string("Vui lòng nhập mã")
  .trim()
  .min(1, "Vui lòng nhập mã")
  .max(50, "Tối đa 50 ký tự")
  .regex(/^[A-Z0-9_-]+$/, "Chỉ gồm chữ in hoa, số, - và _");

export const couponDescriptionSchema = z.string().trim().max(255, "Tối đa 255 ký tự").optional();

/** Ô số tuỳ chọn: antd InputNumber trả `null` khi xoá trắng. */
const optionalInt = (schema: z.ZodNumber) => schema.nullable().optional();

export const couponDiscountValueSchema = z.number("Vui lòng nhập giá trị").positive("Giá trị phải lớn hơn 0");
export const couponMaxDiscountSchema = optionalInt(
  z.number().int("Phải là số nguyên").positive("Giảm tối đa phải lớn hơn 0"),
);
export const couponMinOrderSchema = optionalInt(z.number().int("Phải là số nguyên").min(0, "Không được âm"));
export const couponUsageLimitSchema = optionalInt(z.number().int("Phải là số nguyên").min(1, "Tối thiểu 1 lượt"));

const dateSchema = z.iso.date("Ngày không hợp lệ").optional();

const couponFields = z.object({
  code: couponCodeSchema,
  description: couponDescriptionSchema,
  category: z.enum(["order", "free_shipping"], "Vui lòng chọn loại mã"),
  discountType: z.enum(["percent", "fixed_amount"], "Vui lòng chọn loại giảm"),
  discountValue: couponDiscountValueSchema,
  maxDiscount: couponMaxDiscountSchema,
  minOrderValue: couponMinOrderSchema,
  usageLimit: couponUsageLimitSchema,
  validFrom: dateSchema,
  validUntil: dateSchema,
  isActive: z.boolean(),
});

type CrossFields = Pick<z.infer<typeof couponFields>, "discountType" | "discountValue" | "validFrom" | "validUntil">;

/** Ràng buộc giữa các ô (dùng cho cả thêm lẫn sửa). */
function withCrossChecks<T extends z.ZodType<CrossFields>>(schema: T) {
  return schema
    .refine((v) => v.discountType !== "percent" || v.discountValue <= 100, {
      path: ["discountValue"],
      message: "Phần trăm tối đa 100",
    })
    .refine((v) => v.discountType !== "fixed_amount" || Number.isInteger(v.discountValue), {
      path: ["discountValue"],
      message: "Số tiền phải là số nguyên",
    })
    .refine((v) => !v.validFrom || !v.validUntil || v.validFrom <= v.validUntil, {
      path: ["validRange"],
      message: "Ngày kết thúc phải sau ngày bắt đầu",
    });
}

export const couponFormSchema = withCrossChecks(couponFields);

/** Sửa: backend (`UpdateDiscountCodeDto`) không nhận `code` → bỏ qua ô Mã. */
export const couponUpdateSchema = withCrossChecks(couponFields.extend({ code: z.string().optional() }));

export type CouponFormInput = z.infer<typeof couponFields>;
type CouponBodyInput = Omit<CouponFormInput, "code"> & { code?: string };

/** "2026-12-31" → "2026-12-31T00:00:00+07:00" / "…T23:59:59+07:00" (ngày theo giờ Việt Nam). */
export const startOfDayVN = (date: string) => `${date}T00:00:00+07:00`;
export const endOfDayVN = (date: string) => `${date}T23:59:59+07:00`;

export interface CouponBody {
  code?: string;
  description?: string | null;
  category: "order" | "free_shipping";
  discount_type: "percent" | "fixed_amount";
  discount_value: number;
  max_discount?: number | null;
  min_order_value?: number | null;
  usage_limit?: number | null;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
}

/**
 * Form (camelCase) → body backend (snake_case).
 * - Thêm: bỏ trường rỗng (backend tự để `null`).
 * - Sửa: trường tuỳ chọn để trống gửi `null` để xoá giá trị cũ (backend gán thẳng khi khác `undefined`).
 *   Ngày **không** gửi `null`: backend làm `new Date(null)` = 01/01/1970 → form chặn xoá ngày đã đặt.
 * - Loại ₫ không có "Giảm tối đa".
 */
export function toCouponBody(v: CouponBodyInput, mode: "create" | "edit"): CouponBody {
  const empty = mode === "create" ? undefined : null;
  const orEmpty = <T,>(value: T | null | undefined) => (value === null || value === undefined ? empty : value);
  const description = v.description?.trim();
  return {
    ...(mode === "create" && { code: v.code }),
    description: description ? description : empty,
    category: v.category,
    discount_type: v.discountType,
    discount_value: v.discountValue,
    max_discount: v.discountType === "percent" ? orEmpty(v.maxDiscount) : empty,
    min_order_value: orEmpty(v.minOrderValue),
    usage_limit: orEmpty(v.usageLimit),
    ...(v.validFrom && { valid_from: startOfDayVN(v.validFrom) }),
    ...(v.validUntil && { valid_until: endOfDayVN(v.validUntil) }),
    is_active: v.isActive,
  };
}
