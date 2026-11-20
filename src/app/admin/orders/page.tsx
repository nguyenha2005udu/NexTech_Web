// FDD 8.2.1–8.2.3 — Quản lý đơn hàng (design/admin/04). SSR: danh sách theo ?q=&status=&page=,
// Drawer chi tiết theo ?view=<orderId> (✅Q-04).
import type { Metadata } from "next";
import { Card } from "antd";
import type { AdminOrderDetail } from "@/entities/order";
import { adminOrderService } from "@/entities/order/admin-service";
import {
  AdminOrderTable,
  AdminOrderToolbar,
  OrderDetailDrawer,
  parseOrderListParams,
  parseOrderView,
} from "@/features/admin/orders";
import { ApiError } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Quản lý đơn hàng" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Chi tiết đơn cho Drawer. Không tìm thấy (404) → `null` (Drawer báo "Không tìm thấy đơn hàng"). */
async function loadDetail(id: string | null): Promise<AdminOrderDetail | null> {
  if (!id) return null;
  return adminOrderService.get(id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requirePermission("order:manage");

  const sp = await searchParams;
  const query = parseOrderListParams(sp);
  const viewId = parseOrderView(sp);
  const [list, detail] = await Promise.all([adminOrderService.list(query), loadDetail(viewId)]);

  return (
    <>
      <AdminOrderToolbar />
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <AdminOrderTable items={list.items} total={list.total} page={query.page} pageSize={query.limit} />
      </Card>
      <OrderDetailDrawer key={detail?.id ?? "none"} order={detail} notFound={viewId !== null && detail === null} />
    </>
  );
}
