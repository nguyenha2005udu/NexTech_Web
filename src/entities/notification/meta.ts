import type { NotificationType } from "./types";

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  order_update: "Đơn hàng",
  price_alert: "Giá sản phẩm",
  deal: "Khuyến mãi",
  recommendation: "Gợi ý",
  system: "Hệ thống",
};

/** Chỉ cho phép đường dẫn nội bộ (bắt đầu bằng một dấu "/") — tránh thông báo dẫn ra trang ngoài. */
export function isInternalLink(link: string): boolean {
  return link.startsWith("/") && !link.startsWith("//");
}
