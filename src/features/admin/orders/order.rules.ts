// FDD 8.2.1 — Logic thuần của màn danh sách đơn (design/admin/04 §1, §3). Không gọi API, không biết UI.
import { PRIMARY_ORDER_STATUSES, orderStatusMeta, type AdminOrderListQuery, type OrderStatus } from "@/entities/order";
import { orderIdSchema } from "./schemas";

export const ORDER_PAGE_SIZE = 20;

/** Ô lọc trạng thái: 4 trạng thái của mockup, theo thứ tự `ORDER_STATUS_META` (§1.2 T2). */
export const ORDER_STATUS_OPTIONS: ReadonlyArray<{ value: OrderStatus; label: string }> = PRIMARY_ORDER_STATUSES.map(
  (value) => ({ value, label: orderStatusMeta(value).label }),
);

/** Giá trị `status` order-service chấp nhận (gửi giá trị khác → 400 NT-GEN-0001). */
const API_FILTER_STATUSES: readonly OrderStatus[] = ["processing", "pending", "paid", "shipped", "cancelled", "failed"];

type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** `?q=&status=&page=` trên URL → tham số gọi `GET /api/admin/orders`. Giá trị lạ bị bỏ qua. */
export function parseOrderListParams(
  sp: RawSearchParams,
): Required<Pick<AdminOrderListQuery, "page" | "limit">> & AdminOrderListQuery {
  const search = first(sp.q)?.trim().slice(0, 100) || undefined;
  const rawStatus = first(sp.status);
  const status = API_FILTER_STATUSES.find((s) => s === rawStatus);
  const page = Number(first(sp.page));
  return {
    search,
    status,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: ORDER_PAGE_SIZE,
  };
}

/** `?view=<uuid>` → id đơn cần mở Drawer; sai định dạng → `null` (không gọi API). */
export function parseOrderView(sp: RawSearchParams): string | null {
  const view = first(sp.view);
  return view && orderIdSchema.safeParse(view).success ? view : null;
}
