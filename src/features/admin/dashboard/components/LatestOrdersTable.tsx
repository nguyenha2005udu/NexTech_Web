"use client";

// FDD 8.1 — "Đơn hàng mới nhất" (design/admin/01 §2.4). Client vì cột Table có hàm render + bấm dòng.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Table, Tag, Tooltip } from "antd";
import type { TableColumnsType } from "antd";
import { orderStatusMeta, type AdminOrderListItem } from "@/entities/order";
import { routes } from "@/config/routes";
import { formatDateTime, formatOrderCode, formatVND } from "@/lib/format";
import styles from "./dashboard.module.css";

/** Bấm đơn → mở Drawer chi tiết ở màn Đơn hàng (✅Q-04). */
export const orderViewHref = (id: string) => `${routes.admin.orders}?view=${encodeURIComponent(id)}`;

const columns: TableColumnsType<AdminOrderListItem> = [
  {
    title: "MÃ ĐƠN",
    dataIndex: "id",
    key: "id",
    render: (id: string) => (
      <Tooltip title={id}>
        <Link href={orderViewHref(id)} className={styles.orderCode} onClick={(e) => e.stopPropagation()}>
          {formatOrderCode(id)}
        </Link>
      </Tooltip>
    ),
  },
  {
    title: "KHÁCH HÀNG",
    dataIndex: "user_name",
    key: "user_name",
    render: (name: string | null) => name ?? <span className={styles.muted}>—</span>,
  },
  {
    title: "TỔNG TIỀN",
    dataIndex: "total",
    key: "total",
    render: (total: number) => <span className={styles.money}>{formatVND(total)}</span>,
  },
  {
    title: "TRẠNG THÁI",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      const meta = orderStatusMeta(status);
      return (
        <Tag color={meta.color} variant="solid">
          {meta.label}
        </Tag>
      );
    },
  },
  {
    title: "NGÀY",
    dataIndex: "created_at",
    key: "created_at",
    render: (iso: string) => <span className={styles.muted}>{formatDateTime(iso)}</span>,
  },
];

export function LatestOrdersTable({
  orders,
  unavailable = false,
}: Readonly<{ orders: AdminOrderListItem[]; unavailable?: boolean }>) {
  const router = useRouter();

  return (
    <Card variant="borderless" title={<span className={styles.panelTitle}>Đơn hàng mới nhất</span>}>
      <Table<AdminOrderListItem>
        rowKey="id"
        columns={columns}
        dataSource={orders}
        pagination={false}
        size="middle"
        scroll={{ x: 640 }}
        locale={{ emptyText: unavailable ? "Chưa lấy được danh sách đơn hàng" : "Chưa có đơn hàng" }}
        rowClassName={() => styles.clickableRow}
        onRow={(record) => ({ onClick: () => router.push(orderViewHref(record.id)) })}
      />
    </Card>
  );
}
