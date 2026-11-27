// FDD 8.2.3 — Luật chuyển trạng thái đơn phía admin + tiến trình đơn (design/admin/04 §2.3–2.4, §5).
// Logic thuần, không gọi API. Backend là nơi kiểm luật thật; ở đây chỉ để UI không cho chọn sai.
import { orderStatusMeta, type AdminOrderPayment, type OrderStatus } from "@/entities/order";
import type { PaymentMethod } from "@/entities/transaction";
import type { AdminTargetStatus } from "./schemas";

/**
 * Trạng thái admin được chuyển sang từ `status` (NT.BUSINESS_RULES §5, order-service `ALLOWED_TRANSITIONS`):
 * - `pending` → `shipped` chỉ đơn COD; → `cancelled` luôn được.
 * - `paid` → `shipped` | `cancelled`.
 * - Còn lại (trạng thái cuối, trạng thái của saga) → không có bước nào.
 */
export function adminNextStatuses(status: OrderStatus, method: PaymentMethod | null): AdminTargetStatus[] {
  switch (status) {
    case "pending":
      return method === "cod" ? ["shipped", "cancelled"] : ["cancelled"];
    case "paid":
      return ["shipped", "cancelled"];
    default:
      return [];
  }
}

/** Các câu cảnh báo hiện trong Alert khi admin chọn trạng thái mới (§2.4). */
export function statusChangeWarnings(from: OrderStatus, to: AdminTargetStatus): string[] {
  const lines = [`Đổi trạng thái sang "${orderStatusMeta(to).label}"? Khách hàng sẽ nhận được thông báo.`];
  if (from === "paid" && to === "cancelled") lines.push("Đơn đã thanh toán — cần hoàn tiền thủ công cho khách.");
  if (from === "pending" && to === "shipped") lines.push("Giao dịch COD sẽ được ghi nhận đã thu tiền.");
  return lines;
}

export type TimelineStepStatus = "wait" | "process" | "finish" | "error";

export interface OrderTimeline {
  /** Chỉ số bước hiện tại (antd `Steps.current`). */
  current: number;
  /** Trạng thái của bước hiện tại (antd `Steps.status`). */
  status: TimelineStepStatus;
  titles: [string, string, string];
}

const BASE_TITLES = ["Chờ xử lý", "Đã thanh toán", "Đang giao"] as const;

/**
 * Tiến trình 3 bước Chờ xử lý → Đã thanh toán → Đang giao (✅Q-D3: không có "Hoàn tất").
 * - COD giao rồi: bước 2 đổi nhãn "Đã thu tiền".
 * - Đã huỷ: bước kế tiếp bước đã đạt thành lỗi, nhãn "Đã huỷ". Đơn có giao dịch thành công / đã hoàn tiền
 *   coi như đã qua bước 2 [Inference — tài liệu chỉ ghi "bước đang dừng"].
 * - `failed` / `processing` (trạng thái của saga, mockup không vẽ): dừng ở bước 1 [Inference].
 */
export function orderTimeline(
  status: OrderStatus,
  payment: Pick<AdminOrderPayment, "method" | "status"> | null,
): OrderTimeline {
  const titles: [string, string, string] = [...BASE_TITLES];
  switch (status) {
    case "pending":
      return { current: 0, status: "process", titles };
    case "paid":
      return { current: 1, status: "finish", titles };
    case "shipped":
      if (payment?.method === "cod") titles[1] = "Đã thu tiền";
      return { current: 2, status: "finish", titles };
    case "cancelled": {
      const wasPaid = payment?.status === "success" || payment?.status === "refunded";
      const current = wasPaid ? 2 : 1;
      titles[current] = "Đã huỷ";
      return { current, status: "error", titles };
    }
    case "failed":
      titles[0] = "Thất bại";
      return { current: 0, status: "error", titles };
    default:
      titles[0] = orderStatusMeta(status).label;
      return { current: 0, status: "wait", titles };
  }
}
