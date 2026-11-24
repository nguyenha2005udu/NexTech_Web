// Chỉ export type + hằng (dùng được ở client). Service ở server: "@/entities/order/admin-service" (quản trị),
// "@/entities/order/service" (người mua).
export type {
  AdminOrderDetail,
  AdminOrderLine,
  AdminOrderListItem,
  AdminOrderListQuery,
  AdminOrderPayment,
  CreateOrderInput,
  CreateOrderLine,
  CreatedOrder,
  OrderStatus,
} from "./types";
export { ORDER_STATUS_META, ORDER_STATUSES, PRIMARY_ORDER_STATUSES, isOrderStatus, orderStatusMeta } from "./status";
export type { OrderStatusMeta } from "./status";
