"use client";

// FDD 8.2.6 — Nút "Xác nhận đã thu" (design/admin/06 §2). Nơi duy nhất có thao tác này (✅Q-O5).
// Không hoàn tác được → luôn hỏi lại bằng Modal.confirm. onOk trả Promise: nút OK quay "loading" và hộp
// chỉ đóng khi action xong → không bấm được hai lần.
import { App, Button } from "antd";
import { useRouter } from "next/navigation";
import type { AdminPaymentListItem } from "@/entities/transaction";
import { formatOrderCode, formatPaymentCode, formatVND } from "@/lib/format";
import { confirmCodPayment } from "../actions";
import styles from "./transactions.module.css";

export interface ConfirmCodButtonProps {
  payment: Pick<AdminPaymentListItem, "id" | "order_id" | "amount">;
  /** `link` trong bảng; `block` ở chân Drawer. */
  variant?: "link" | "block";
}

export function ConfirmCodButton({ payment, variant = "link" }: Readonly<ConfirmCodButtonProps>) {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const code = formatPaymentCode(payment.id);

  async function confirm() {
    const result = await confirmCodPayment({ id: payment.id });
    if (result.ok) {
      // revalidatePath trong action làm mới bảng + Drawer
      message.success("Đã xác nhận thu tiền");
      return;
    }
    // NT-PAY-1009 (đã có người xác nhận) / NT-PAY-1001 (không còn giao dịch): tải lại để bảng khớp backend
    message.warning(result.message);
    router.refresh();
  }

  function open() {
    modal.confirm({
      title: "Xác nhận đã thu tiền?",
      content: `Giao dịch ${code} · Đơn ${formatOrderCode(payment.order_id)} · ${formatVND(payment.amount)}. Thao tác này đổi giao dịch sang Thành công.`,
      okText: "Đã thu tiền",
      cancelText: "Huỷ",
      onOk: confirm,
    });
  }

  const label = `Xác nhận đã thu ${code}`;
  return variant === "block" ? (
    <Button type="primary" block aria-label={label} onClick={open}>
      Xác nhận đã thu
    </Button>
  ) : (
    <Button type="link" className={`${styles.linkButton} ${styles.confirmLink}`} aria-label={label} onClick={open}>
      Xác nhận đã thu
    </Button>
  );
}
