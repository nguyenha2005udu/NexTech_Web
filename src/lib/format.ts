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

// Cố định múi giờ để server và client in cùng một ngày (tránh hydration mismatch).
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** "2026-11-01T09:00:00.000Z" → "01/11/2026" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
