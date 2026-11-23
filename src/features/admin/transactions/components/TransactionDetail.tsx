"use client";

// FDD 8.2.5 — Drawer chi tiết giao dịch (design/admin/06 §3, ảnh 11). Mở theo ?view=<id>; đóng = bỏ ?view.
// "Mã giao dịch PayOS" thêm ngoài mockup (chỉ PayOS có giá trị); gateway_response không hiện (§3.2).
import { useEffect } from "react";
import Link from "next/link";
import { App, Descriptions, Drawer, Tag } from "antd";
import type { DescriptionsProps } from "antd";
import { paymentMethodMeta, paymentStatusMeta, type AdminPaymentDetail } from "@/entities/transaction";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatDateTime, formatOrderCode, formatPaymentCode, formatVND } from "@/lib/format";
import { canConfirmCod, orderViewHref } from "../payment.rules";
import { ConfirmCodButton } from "./ConfirmCodButton";
import styles from "./transactions.module.css";

function detailItems(p: AdminPaymentDetail): DescriptionsProps["items"] {
  const method = paymentMethodMeta(p.method);
  const status = paymentStatusMeta(p.status);
  const items: NonNullable<DescriptionsProps["items"]> = [
    { key: "code", label: "Mã giao dịch", children: formatPaymentCode(p.id) },
    {
      key: "method",
      label: "Phương thức",
      children: (
        <Tag color={method.color} variant="solid">
          {method.label}
        </Tag>
      ),
    },
    {
      key: "amount",
      label: "Số tiền",
      children: <span className={styles.money}>{p.currency === "VND" ? formatVND(p.amount) : `${p.amount} ${p.currency}`}</span>,
    },
    {
      key: "status",
      label: "Trạng thái",
      children: (
        <Tag color={status.color} variant="solid">
          {status.label}
        </Tag>
      ),
    },
    { key: "paid_at", label: "Ngày", children: p.paid_at ? formatDateTime(p.paid_at) : "—" },
    {
      key: "order",
      label: "Đơn liên kết",
      children: (
        <Link href={orderViewHref(p.order_id)}>
          Đơn {formatOrderCode(p.order_id)} <span aria-hidden="true">↗</span>
        </Link>
      ),
    },
  ];
  if (p.method === "payos" && p.transaction_id) {
    items.push({
      key: "transaction_id",
      label: "Mã giao dịch PayOS",
      children: <span className={styles.mono}>{p.transaction_id}</span>,
    });
  }
  return items;
}

export interface TransactionDetailProps {
  /** `null` khi không có ?view hoặc không tìm thấy giao dịch. */
  payment: AdminPaymentDetail | null;
  /** URL có ?view hợp lệ nhưng backend trả 404 → báo "Không tìm thấy giao dịch" rồi bỏ ?view. */
  notFound?: boolean;
}

export function TransactionDetail({ payment, notFound = false }: Readonly<TransactionDetailProps>) {
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();

  useEffect(() => {
    if (!notFound) return;
    message.warning("Không tìm thấy giao dịch");
    setParams({ view: undefined });
  }, [notFound, message, setParams]);

  if (!payment) return null;

  return (
    <Drawer
      open
      placement="right"
      size={320}
      title={`Giao dịch ${formatPaymentCode(payment.id)}`}
      onClose={() => setParams({ view: undefined })}
      destroyOnHidden
      footer={canConfirmCod(payment) ? <ConfirmCodButton payment={payment} variant="block" /> : undefined}
    >
      <Descriptions
        className={styles.descriptions}
        column={1}
        size="small"
        colon={false}
        classNames={{ label: styles.label, content: styles.value }}
        items={detailItems(payment)}
      />
    </Drawer>
  );
}
