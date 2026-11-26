// FDD 8.2.4–8.2.6 — Logic thuần của màn Thanh toán (design/admin/06 §1, §4). Không gọi API, không biết UI.
import { routes } from "@/config/routes";
import {
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
  type AdminPaymentListItem,
  type AdminPaymentListQuery,
  type PaymentMethod,
  type PaymentStatus,
} from "@/entities/transaction";
import { paymentIdSchema } from "./schemas";

export const PAYMENT_PAGE_SIZE = 20;

const PAYMENT_METHODS: readonly PaymentMethod[] = ["payos", "cod"];
const PAYMENT_STATUSES: readonly PaymentStatus[] = ["success", "pending", "failed", "refunded"];

/** Ô lọc phương thức (§1.2 T1). */
export const PAYMENT_METHOD_OPTIONS: ReadonlyArray<{ value: PaymentMethod; label: string }> = PAYMENT_METHODS.map(
  (value) => ({ value, label: PAYMENT_METHOD_META[value].label }),
);

/** Ô lọc trạng thái (§1.2 T2), theo thứ tự `PAYMENT_STATUS_META`. */
export const PAYMENT_STATUS_OPTIONS: ReadonlyArray<{ value: PaymentStatus; label: string }> = PAYMENT_STATUSES.map(
  (value) => ({ value, label: PAYMENT_STATUS_META[value].label }),
);

/** Chỉ giao dịch COD đang chờ mới xác nhận đã thu được (§4; backend: NT-PAY-1008 / NT-PAY-1009). */
export const canConfirmCod = (p: Pick<AdminPaymentListItem, "method" | "status">): boolean =>
  p.method === "cod" && p.status === "pending";

/** Link "Đơn liên kết" — cùng tab, mở Drawer đơn ở màn Đơn hàng (✅Q-T3). */
export const orderViewHref = (orderId: string): string =>
  `${routes.admin.orders}?view=${encodeURIComponent(orderId)}`;

type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** `?method=&status=&page=` trên URL → tham số `GET /api/admin/payments`. Giá trị lạ bị bỏ qua (backend trả 400). */
export function parsePaymentListParams(
  sp: RawSearchParams,
): Required<Pick<AdminPaymentListQuery, "page" | "limit">> & AdminPaymentListQuery {
  const rawMethod = first(sp.method);
  const rawStatus = first(sp.status);
  const page = Number(first(sp.page));
  return {
    method: PAYMENT_METHODS.find((m) => m === rawMethod),
    status: PAYMENT_STATUSES.find((s) => s === rawStatus),
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: PAYMENT_PAGE_SIZE,
  };
}

/** `?view=<uuid>` → id giao dịch cần mở Drawer; sai định dạng → `null` (không gọi API). */
export function parsePaymentView(sp: RawSearchParams): string | null {
  const view = first(sp.view);
  return view && paymentIdSchema.safeParse(view).success ? view : null;
}
