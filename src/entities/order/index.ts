// Chỉ export type + hằng (dùng được ở client). Service ở server: import từ "@/entities/order/admin-service".
export type {
  AdminOrderDetail,
  AdminOrderLine,
  AdminOrderListItem,
  AdminOrderListQuery,
  AdminOrderPayment,
  OrderStatus,
} from "./types";
export { ORDER_STATUS_META, ORDER_STATUSES, PRIMARY_ORDER_STATUSES, isOrderStatus, orderStatusMeta } from "./status";
export type { OrderStatusMeta } from "./status";
