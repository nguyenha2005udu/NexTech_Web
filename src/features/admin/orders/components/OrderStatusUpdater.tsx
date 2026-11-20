"use client";

// FDD 8.2.3 — Cập nhật trạng thái đơn trong Drawer (design/admin/04 §2.4).
// Select chỉ có trạng thái được phép; chọn khác hiện tại → Alert cảnh báo; Lưu → Server Action.
// ✅Q-O5: không có nút "Xác nhận đã thu" ở đây (làm ở màn Thanh toán).
import { useState, useTransition } from "react";
import { Alert, App, Button, Select } from "antd";
import { orderStatusMeta, type OrderStatus } from "@/entities/order";
import type { PaymentMethod } from "@/entities/transaction";
import { updateOrderStatus } from "../actions";
import { adminNextStatuses, statusChangeWarnings } from "../order-status.rules";
import type { AdminTargetStatus } from "../schemas";
import styles from "./orders.module.css";

export interface OrderStatusUpdaterProps {
  orderId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
}

export function OrderStatusUpdater({ orderId, status, paymentMethod }: Readonly<OrderStatusUpdaterProps>) {
  const { message } = App.useApp();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<OrderStatus>(status);
  const nexts = adminNextStatuses(status, paymentMethod);

  if (nexts.length === 0) {
    return <p className={styles.muted}>Đơn đã ở trạng thái cuối</p>;
  }

  const target = nexts.find((s) => s === selected);
  const options = [status, ...nexts].map((value) => ({ value, label: orderStatusMeta(value).label }));

  function save(next: AdminTargetStatus) {
    startTransition(async () => {
      const result = await updateOrderStatus({ id: orderId, status: next });
      // revalidatePath trong action làm mới bảng + Drawer; Drawer vẫn mở (?view giữ nguyên)
      if (result.ok) message.success("Đã cập nhật trạng thái");
      else message.warning(result.message);
    });
  }

  return (
    <div className={styles.updater}>
      <label htmlFor="order-status-select" className={styles.sectionLabel}>
        Cập nhật trạng thái
      </label>
      <Select<OrderStatus>
        id="order-status-select"
        value={selected}
        options={options}
        onChange={setSelected}
        disabled={pending}
      />
      {target && (
        <Alert
          type="warning"
          showIcon
          title={statusChangeWarnings(status, target).map((line) => (
            <p key={line} className={styles.alertLine}>
              {line}
            </p>
          ))}
        />
      )}
      <Button type="primary" block disabled={!target} loading={pending} onClick={() => target && save(target)}>
        Lưu trạng thái
      </Button>
    </div>
  );
}
