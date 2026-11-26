// FDD 8.2.4–8.2.6 — Quản lý thanh toán (design/admin/06). SSR: danh sách theo ?method=&status=&page=,
// Drawer chi tiết theo ?view=<paymentId>. Xác nhận COD là Server Action riêng (quyền payment:confirm-cod).
import type { Metadata } from "next";
import { Card } from "antd";
import type { AdminPaymentDetail } from "@/entities/transaction";
import { adminPaymentService } from "@/entities/transaction/admin-service";
import {
  TransactionDetail,
  TransactionTable,
  TransactionToolbar,
  parsePaymentListParams,
  parsePaymentView,
} from "@/features/admin/transactions";
import { ApiError } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Quản lý thanh toán" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Chi tiết cho Drawer. Không tìm thấy (404 NT-PAY-1001) → `null` (Drawer báo "Không tìm thấy giao dịch"). */
async function loadDetail(id: string | null): Promise<AdminPaymentDetail | null> {
  if (!id) return null;
  return adminPaymentService.get(id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
}

export default async function AdminTransactionsPage({ searchParams }: Props) {
  await requirePermission("transaction:read");

  const sp = await searchParams;
  const query = parsePaymentListParams(sp);
  const viewId = parsePaymentView(sp);
  const [list, detail] = await Promise.all([adminPaymentService.list(query), loadDetail(viewId)]);

  return (
    <>
      <TransactionToolbar />
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <TransactionTable items={list.items} total={list.total} page={query.page} pageSize={query.limit} />
      </Card>
      <TransactionDetail
        key={detail ? `${detail.id}-${detail.status}` : "none"}
        payment={detail}
        notFound={viewId !== null && detail === null}
      />
    </>
  );
}
