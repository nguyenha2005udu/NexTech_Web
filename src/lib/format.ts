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

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** "2026-07-24T03:24:00.000Z" → "24/07/2026 10:24" (giờ Việt Nam). Locale vi-VN tự in giờ trước ngày nên ghép tay. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
}

const compactFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

/** 2450000000 → "2,45 tỷ ₫"; 41500000 → "41,5 triệu ₫"; dưới 1 triệu → formatVND. */
export function formatCompactVND(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${compactFormatter.format(amount / 1_000_000_000)} tỷ ₫`;
  if (abs >= 1_000_000) return `${compactFormatter.format(amount / 1_000_000)} triệu ₫`;
  return formatVND(amount);
}

// Backend dùng UUID cho đơn hàng và giao dịch; giao diện hiện 8 ký tự đầu viết hoa (design/admin Q-D4, Q-T1).
const shortId = (uuid: string) => uuid.replace(/-/g, "").slice(0, 8).toUpperCase();

/** "a1b2c3d4-…" → "#A1B2C3D4" */
export function formatOrderCode(uuid: string): string {
  return `#${shortId(uuid)}`;
}

/** "a1b2c3d4-…" → "PAY-A1B2C3D4" */
export function formatPaymentCode(uuid: string): string {
  return `PAY-${shortId(uuid)}`;
}

/** "a1b2c3d4-…" → "#A1B2C3D4" (mã người dùng, design/admin/07 §2.2) */
export function formatUserCode(uuid: string): string {
  return `#${shortId(uuid)}`;
}
