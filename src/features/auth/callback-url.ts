import { routes } from "@/config/routes";

// FDD 1.1.2 — `?callbackUrl=` là đầu vào do người ngoài đặt (link đăng nhập có thể bị gửi cho nạn nhân), nên chỉ
// chấp nhận đường dẫn NỘI BỘ của web. Không chỉ kiểm `//`: trình duyệt coi `\` như `/` và bỏ tab/xuống dòng khi
// phân tích URL, nên `/\evil.com` hay `/<tab>/evil.com` vẫn thành `//evil.com` → chuyển sang trang ngoài.

/** Gốc giả chỉ để phân tích đường dẫn; giá trị không bao giờ ra ngoài hàm. */
const PROBE_ORIGIN = "http://nextech.invalid";

export function safeCallbackUrl(value: string | null | undefined, fallback: string = routes.home): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  // Dấu `\` và ký tự điều khiển (tab, xuống dòng…) bị trình duyệt chuẩn hoá thành thứ khác — từ chối hẳn.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return fallback;
    const path = url.pathname + url.search + url.hash;
    // Chuẩn hoá `..` có thể làm lộ `//` ("/a/../..//evil.com" → "//evil.com"): kiểm lại SAU khi chuẩn hoá.
    return path.startsWith("//") ? fallback : path;
  } catch {
    return fallback;
  }
}
