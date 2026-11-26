// Chỉ export type + hằng (dùng được ở client). Service ở server: "@/entities/notification/service".
export type { Notification, NotificationList, NotificationType } from "./types";
export { NOTIFICATION_MAX_PAGE_SIZE, NOTIFICATION_PAGE_SIZE } from "./types";
export { NOTIFICATION_TYPE_LABEL, isInternalLink } from "./meta";
export { parsePage, parsePageSize } from "./query";
