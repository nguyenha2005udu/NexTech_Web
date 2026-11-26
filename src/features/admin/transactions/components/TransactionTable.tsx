"use client";

// FDD 8.2.4 — Bảng giao dịch (design/admin/06 §1.3). Header dính + thân cuộn như các màn admin khác.
// "Xem" mở Drawer qua ?view=<id>; "Xác nhận đã thu" chỉ ở dòng COD đang chờ (§2).
// NGÀY = paid_at (chưa có created_at — BE-5, ✅Q-T2), null → "—".
import Link from "next/link";
import { Button, Table, Tag, Tooltip } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { paymentMethodMeta, paymentStatusMeta, type AdminPaymentListItem } from "@/entities/transaction";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatDateTime, formatNumber, formatOrderCode, formatPaymentCode, formatVND } from "@/lib/format";
import { canConfirmCod, orderViewHref } from "../payment.rules";
import { ConfirmCodButton } from "./ConfirmCodButton";
import styles from "./transactions.module.css";

function ViewButton({ id }: Readonly<{ id: string }>) {
  const { setParams } = useAdminListParams();
  return (
    <Button
      type="link"
      className={styles.linkButton}
      aria-label={`Xem giao dịch ${formatPaymentCode(id)}`}
      onClick={() => setParams({ view: id })}
    >
      Xem
    </Button>
  );
}

const columns: TableColumnsType<AdminPaymentListItem> = [
  {
    title: "MÃ GD",
    dataIndex: "id",
    key: "id",
    width: 140,
    render: (id: string) => (
      <Tooltip title={id}>
        <span className={styles.paymentCode}>{formatPaymentCode(id)}</span>
      </Tooltip>
    ),
  },
  {
    title: "ĐƠN LIÊN KẾT",
    dataIndex: "order_id",
    key: "order_id",
    width: 130,
    render: (orderId: string) => (
      <Link href={orderViewHref(orderId)} className={styles.orderLink}>
        {formatOrderCode(orderId)}
      </Link>
    ),
  },
  {
    title: "PHƯƠNG THỨC",
    dataIndex: "method",
    key: "method",
    width: 120,
    render: (_: unknown, p) => {
      const meta = paymentMethodMeta(p.method);
      return (
        <Tag color={meta.color} variant="solid">
          {meta.label}
        </Tag>
      );
    },
  },
  {
    title: "SỐ TIỀN",
    dataIndex: "amount",
    key: "amount",
    width: 140,
    render: (amount: number) => <span className={styles.money}>{formatVND(amount)}</span>,
  },
  {
    title: "TRẠNG THÁI",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (_: unknown, p) => {
      const meta = paymentStatusMeta(p.status);
      return (
        <Tag color={meta.color} variant="solid">
          {meta.label}
        </Tag>
      );
    },
  },
  {
    title: "NGÀY",
    dataIndex: "paid_at",
    key: "paid_at",
    width: 150,
    render: (paidAt: string | null) => <span className={styles.muted}>{paidAt ? formatDateTime(paidAt) : "—"}</span>,
  },
  {
    title: "THAO TÁC",
    key: "actions",
    align: "right",
    width: 200,
    fixed: "right",
    render: (_: unknown, p) => (
      <span className={styles.actions}>
        {canConfirmCod(p) && <ConfirmCodButton payment={p} />}
        <ViewButton id={p.id} />
      </span>
    ),
  },
];

export interface TransactionTableProps {
  items: AdminPaymentListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function TransactionTable({ items, total, page, pageSize }: Readonly<TransactionTableProps>) {
  const { setParams } = useAdminListParams();

  const onChange: TableProps<AdminPaymentListItem>["onChange"] = (pagination, _filters, _sorter, extra) => {
    if (extra.action === "paginate") setParams({ page: pagination.current });
  };

  return (
    <Table<AdminPaymentListItem>
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
        showTotal: (n) => `${formatNumber(n)} giao dịch`,
      }}
    />
  );
}
