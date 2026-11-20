// FDD 8.1 — Khối "Đơn theo trạng thái" (design/admin/01 §2.3). Logic thuần.
import { ORDER_STATUSES, PRIMARY_ORDER_STATUSES, orderStatusMeta } from "@/entities/order";

export interface StatusRow {
  status: string;
  label: string;
  barColor: string;
  count: number;
  /** Phần trăm làm tròn số nguyên; tổng các dòng có thể ≠ 100. */
  percent: number;
}

/**
 * 4 trạng thái chính luôn hiện (kể cả 0); trạng thái phụ chỉ hiện khi count > 0, xếp theo ORDER_STATUS_META,
 * trạng thái lạ xếp cuối. Không có dòng "Hoàn tất" (✅Q-D3).
 */
export function toStatusBreakdown(items: ReadonlyArray<{ status: string; count: number }>): StatusRow[] {
  const counts = new Map<string, number>();
  for (const { status, count } of items) counts.set(status, (counts.get(status) ?? 0) + Math.max(count, 0));
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);

  const known: string[] = [...ORDER_STATUSES];
  const order = [
    ...PRIMARY_ORDER_STATUSES,
    ...ORDER_STATUSES.filter((s) => !PRIMARY_ORDER_STATUSES.includes(s) && (counts.get(s) ?? 0) > 0),
    ...[...counts.keys()].filter((s) => !known.includes(s) && (counts.get(s) ?? 0) > 0),
  ];

  return order.map((status) => {
    const count = counts.get(status) ?? 0;
    const meta = orderStatusMeta(status);
    return {
      status,
      label: meta.label,
      barColor: meta.barColor,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}
