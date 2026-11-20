// Public API của feature admin/coupons (FDD 8.3). Chỉ dùng trong app/admin.
export { CouponToolbar } from "./components/CouponToolbar";
export { CouponTable } from "./components/CouponTable";
export type { CouponTableProps } from "./components/CouponTable";
export { CouponEditor } from "./components/CouponEditor";
export type { CouponEditorProps } from "./components/CouponEditor";
export { emptyCouponValues, parseCouponListParams, parseCouponModal, toCouponFormValues } from "./coupon.rules";
export type { CouponModalState } from "./coupon.rules";
