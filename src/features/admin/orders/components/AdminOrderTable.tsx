"use client";

// FDD 8.2.1 — Bảng đơn hàng (design/admin/04 §1.3). Header dính + thân cuộn như màn sản phẩm;
// "Xem" mở Drawer chi tiết qua ?view=<id> (✅Q-04). Dòng email chỉ hiện khi API trả `user_email` (✅Q-O2).
import { Button, Table, Tag, Tooltip } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { orderStatusMeta, type AdminOrderListItem } from "@/entities/order";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatDateTime, formatNumber, formatOrderCode, formatVND } from "@/lib/format";
import styles from "./orders.module.css";

function ViewButton({ id }: Readonly<{ id: string }>) {
  const { setParams } = useAdminListParams();
  return (
    <Button
      type="link"
      className={styles.linkButton}
      aria-label={`Xem đơn ${formatOrderCode(id)}`}
      onClick={() => setParams({ view: id })}
    >
      Xem
    </Button>
  );
}

const columns: TableColumnsType<AdminOrderListItem> = [
  {
    title: "MÃ ĐƠN",
    dataIndex: "id",
    key: "id",
    width: 120,
    render: (id: string) => (
      <Tooltip title={id}>
        <span className={styles.orderCode}>{formatOrderCode(id)}</span>
      </Tooltip>
    ),
  },
  {
    title: "KHÁCH HÀNG",
    key: "customer",
    width: 220,
    render: (_: unknown, order) => (
      <span className={styles.customer}>
        {order.user_name ?? <span className={styles.muted}>—</span>}
        {order.user_email && <span className={`${styles.muted} ${styles.small}`}>{order.user_email}</span>}
      </span>
    ),
  },
  { title: "SỐ SP", dataIndex: "product_count", key: "product_count", width: 80 },
  {
    title: "TỔNG TIỀN",
    dataIndex: "total",
    key: "total",
    width: 140,
    render: (total: number) => <span className={styles.money}>{formatVND(total)}</span>,
  },
  {
    title: "TRẠNG THÁI",
    dataIndex: "status",
    key: "status",
    width: 140,
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
    title: "NGÀY ĐẶT",
    dataIndex: "created_at",
    key: "created_at",
    width: 150,
    render: (iso: string) => <span className={styles.muted}>{formatDateTime(iso)}</span>,
  },
  {
    title: "THAO TÁC",
    key: "actions",
    align: "right",
    width: 90,
    fixed: "right",
    render: (_: unknown, order) => <ViewButton id={order.id} />,
  },
];

export interface AdminOrderTableProps {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function AdminOrderTable({ items, total, page, pageSize }: Readonly<AdminOrderTableProps>) {
  const { setParams } = useAdminListParams();

  const onChange: TableProps<AdminOrderListItem>["onChange"] = (pagination, _filters, _sorter, extra) => {
    if (extra.action === "paginate") setParams({ page: pagination.current });
  };

  return (
    <Table<AdminOrderListItem>
      rowKey="id"
      columns={columns}
      dataSource={items}
      size="middle"
      sticky
      scroll={{ x: "max-content", y: "calc(100vh - 260px)" }}
      locale={{ emptyText: "Không có dữ liệu phù hợp" }}
      onChange={onChange}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        hideOnSinglePage: true,
        showTotal: (n) => `${formatNumber(n)} đơn hàng`,
      }}
    />
  );
}
