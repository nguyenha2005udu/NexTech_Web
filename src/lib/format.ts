const vndFormatter = new Intl.NumberFormat("vi-VN");
const ratingFormatter = new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 14990000 → "14.990.000 ₫" */
export function formatVND(amount: number): string {
  return `${vndFormatter.format(amount)} ₫`;
}

/** 14990000 → "14.990.000" (ô nhập giá, không kèm ký hiệu) */
export function formatNumber(amount: number): string {
  return vndFormatter.format(amount);
}

/** 4.7 → "4,7" */
export function formatRating(rating: number): string {
  return ratingFormatter.format(rating);
}
