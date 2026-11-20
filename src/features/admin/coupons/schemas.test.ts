import type { ZodType } from "zod";
import { couponFormSchema, couponUpdateSchema, toCouponBody, type CouponFormInput } from "./schemas";

const valid: CouponFormInput = {
  code: "SALE10",
  description: "Giảm 10% toàn bộ",
  category: "order",
  discountType: "percent",
  discountValue: 10,
  maxDiscount: 200_000,
  minOrderValue: 1_000_000,
  usageLimit: 500,
  validFrom: "2026-11-01",
  validUntil: "2026-12-31",
  isActive: true,
};

const errorAt = (input: unknown, schema: ZodType = couponFormSchema) => {
  const result = schema.safeParse(input);
  if (result.success) return null;
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("couponFormSchema", () => {
  it("dữ liệu đúng mockup hợp lệ", () => {
    expect(couponFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each(["sale10", "SALE 10", "GIẢM", ""])("mã '%s' bị từ chối", (code) => {
    expect(errorAt({ ...valid, code })).toHaveProperty("code");
  });

  it("mã dài hơn 50 ký tự bị từ chối", () => {
    expect(errorAt({ ...valid, code: "A".repeat(51) })).toEqual({ code: "Tối đa 50 ký tự" });
  });

  it("phần trăm > 100 → lỗi ở discountValue", () => {
    expect(errorAt({ ...valid, discountValue: 101 })).toEqual({ discountValue: "Phần trăm tối đa 100" });
  });

  it("số tiền 0 hoặc thập phân → lỗi", () => {
    expect(errorAt({ ...valid, discountType: "fixed_amount", discountValue: 0 })).toHaveProperty("discountValue");
    expect(errorAt({ ...valid, discountType: "fixed_amount", discountValue: 1500.5 })).toEqual({
      discountValue: "Số tiền phải là số nguyên",
    });
  });

  it("thiếu giá trị → 'Vui lòng nhập giá trị'", () => {
    expect(errorAt({ ...valid, discountValue: undefined })).toEqual({ discountValue: "Vui lòng nhập giá trị" });
  });

  it("giới hạn lượt 0 → lỗi; null / bỏ trống hợp lệ", () => {
    expect(errorAt({ ...valid, usageLimit: 0 })).toEqual({ usageLimit: "Tối thiểu 1 lượt" });
    expect(couponFormSchema.safeParse({ ...valid, usageLimit: null }).success).toBe(true);
    expect(couponFormSchema.safeParse({ ...valid, usageLimit: undefined }).success).toBe(true);
  });

  it("ngày kết thúc trước ngày bắt đầu → lỗi ở validRange", () => {
    expect(errorAt({ ...valid, validFrom: "2026-12-31", validUntil: "2026-12-01" })).toEqual({
      validRange: "Ngày kết thúc phải sau ngày bắt đầu",
    });
  });

  it("ngày sai định dạng bị từ chối", () => {
    expect(errorAt({ ...valid, validUntil: "31/12/2026" })).toHaveProperty("validUntil");
  });
});

describe("couponUpdateSchema", () => {
  it("không cần mã (ô Mã khoá khi sửa) nhưng vẫn kiểm ràng buộc chéo", () => {
    expect(couponUpdateSchema.safeParse({ ...valid, code: undefined }).success).toBe(true);
    expect(errorAt({ ...valid, code: undefined, discountValue: 150 }, couponUpdateSchema)).toEqual({
      discountValue: "Phần trăm tối đa 100",
    });
  });
});

describe("toCouponBody", () => {
  it("thêm: camel → snake, ngày thành đầu / cuối ngày giờ VN", () => {
    expect(toCouponBody(valid, "create")).toEqual({
      code: "SALE10",
      description: "Giảm 10% toàn bộ",
      category: "order",
      discount_type: "percent",
      discount_value: 10,
      max_discount: 200_000,
      min_order_value: 1_000_000,
      usage_limit: 500,
      valid_from: "2026-11-01T00:00:00+07:00",
      valid_until: "2026-12-31T23:59:59+07:00",
      is_active: true,
    });
  });

  it("thêm: bỏ trường trống (không gửi null)", () => {
    const body = toCouponBody(
      { ...valid, description: " ", maxDiscount: null, minOrderValue: null, usageLimit: undefined, validFrom: undefined, validUntil: undefined },
      "create",
    );
    expect(body.description).toBeUndefined();
    expect(body.usage_limit).toBeUndefined();
    expect(body).not.toHaveProperty("valid_from");
    expect(body).not.toHaveProperty("valid_until");
  });

  it("sửa: không gửi code; trường trống gửi null để xoá giá trị cũ; ngày trống không gửi", () => {
    const body = toCouponBody({ ...valid, description: "", usageLimit: null, minOrderValue: null, validFrom: undefined }, "edit");
    expect(body).not.toHaveProperty("code");
    expect(body).toMatchObject({ description: null, usage_limit: null, min_order_value: null });
    expect(body).not.toHaveProperty("valid_from");
    expect(body.valid_until).toBe("2026-12-31T23:59:59+07:00");
  });

  it("loại ₫ không gửi max_discount (sửa → null để xoá)", () => {
    const fixed = { ...valid, discountType: "fixed_amount" as const, discountValue: 50_000 };
    expect(toCouponBody(fixed, "create").max_discount).toBeUndefined();
    expect(toCouponBody(fixed, "edit").max_discount).toBeNull();
  });
});
