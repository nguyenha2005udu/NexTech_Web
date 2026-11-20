import type { AdminCoupon } from "@/entities/coupon";
import {
  clearedDateError,
  emptyCouponValues,
  formatCouponUsage,
  formatCouponValue,
  parseCouponListParams,
  parseCouponModal,
  toCouponFormValues,
  toVNDate,
  usageLimitError,
} from "./coupon.rules";

const ID = "c22e5c86-715a-43a1-b459-cb91ccec43f4";

const coupon: AdminCoupon = {
  id: ID,
  code: "SALE10",
  description: null,
  category: "free_shipping",
  discount_type: "percent",
  discount_value: 10,
  min_order_value: null,
  max_discount: 200_000,
  usage_limit: null,
  used_count: 124,
  valid_from: "2026-10-31T17:00:00.000Z", // 01/11 00:00 giờ VN
  valid_until: "2026-12-31T16:59:59.000Z", // 31/12 23:59 giờ VN
  is_active: true,
  status: "running",
};

describe("parseCouponListParams", () => {
  it("URL rỗng → trang 1, 20 dòng", () => {
    expect(parseCouponListParams({})).toEqual({ search: undefined, status: undefined, page: 1, limit: 20 });
  });

  it("đọc q, status hợp lệ, page; status lạ / trang sai bị bỏ", () => {
    expect(parseCouponListParams({ q: " sale ", status: "paused", page: "2" })).toEqual({
      search: "sale",
      status: "paused",
      page: 2,
      limit: 20,
    });
    expect(parseCouponListParams({ status: "expired", page: "0" })).toMatchObject({ status: undefined, page: 1 });
  });
});

describe("parseCouponModal", () => {
  it("create / edit có UUID; còn lại không mở", () => {
    expect(parseCouponModal({ modal: "create" })).toEqual({ mode: "create" });
    expect(parseCouponModal({ modal: "edit", id: ID })).toEqual({ mode: "edit", id: ID });
    expect(parseCouponModal({ modal: "edit", id: "abc" })).toBeNull();
    expect(parseCouponModal({ modal: "edit" })).toBeNull();
    expect(parseCouponModal({})).toBeNull();
  });
});

describe("hiển thị bảng", () => {
  it("giá trị: 10% / 50.000₫", () => {
    expect(formatCouponValue({ discount_type: "percent", discount_value: 10 })).toBe("10%");
    expect(formatCouponValue({ discount_type: "fixed_amount", discount_value: 50_000 })).toBe("50.000₫");
  });

  it("đã dùng: 124/500; không giới hạn → 124/∞", () => {
    expect(formatCouponUsage({ used_count: 124, usage_limit: 500 })).toBe("124/500");
    expect(formatCouponUsage({ used_count: 1240, usage_limit: null })).toBe("1.240/∞");
  });
});

describe("giá trị form", () => {
  it("toVNDate đổi ISO UTC sang ngày giờ VN", () => {
    expect(toVNDate("2026-10-31T17:00:00.000Z")).toBe("2026-11-01");
    expect(toVNDate("2026-10-31T16:59:59.000Z")).toBe("2026-10-31");
  });

  it("dòng bảng → form sửa (ngày theo giờ VN, mô tả null → rỗng)", () => {
    expect(toCouponFormValues(coupon)).toEqual({
      code: "SALE10",
      description: "",
      category: "free_shipping",
      discountType: "percent",
      discountValue: 10,
      maxDiscount: 200_000,
      minOrderValue: null,
      usageLimit: null,
      validFrom: "2026-11-01",
      validUntil: "2026-12-31",
      isActive: true,
    });
  });

  it("không có ngày → undefined", () => {
    const values = toCouponFormValues({ ...coupon, valid_from: null, valid_until: null });
    expect(values.validFrom).toBeUndefined();
    expect(values.validUntil).toBeUndefined();
  });

  it("form thêm mặc định: loại đơn hàng, %, đang bật", () => {
    expect(emptyCouponValues()).toMatchObject({ category: "order", discountType: "percent", isActive: true });
  });

  it("clearedDateError: xoá ngày đã có → lỗi; đổi ngày / thêm ngày mới → hợp lệ", () => {
    const initial = { validFrom: "2026-11-01", validUntil: "2026-12-31" };
    expect(clearedDateError(initial, { validFrom: "2026-11-01" })).toBe("Không bỏ được ngày đã đặt — hãy chọn ngày khác");
    expect(clearedDateError(initial, { validUntil: "2026-12-31" })).not.toBeNull();
    expect(clearedDateError(initial, { validFrom: "2026-11-02", validUntil: "2027-01-31" })).toBeNull();
    expect(clearedDateError({}, { validUntil: "2027-01-31" })).toBeNull();
  });

  it("usageLimitError: nhỏ hơn số lượt đã dùng → lỗi", () => {
    expect(usageLimitError(100, 124)).toBe("Đã dùng 124 lượt — giới hạn phải lớn hơn hoặc bằng");
    expect(usageLimitError(124, 124)).toBeNull();
    expect(usageLimitError(null, 124)).toBeNull();
  });
});
