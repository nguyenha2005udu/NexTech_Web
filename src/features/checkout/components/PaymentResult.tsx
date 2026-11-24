// FDD 5.1.2 — Kết quả đặt hàng / thanh toán (Figma 03.08 COD, 03.09 thành công, 03.10 đang xác nhận,
// 03.11 chưa hoàn tất). Server Component: nội dung dựng từ dữ liệu đơn do backend trả (không tin URL).
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, CheckIcon, ClockIcon, CloseIcon } from "@/components/ui/icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { routes } from "@/config/routes";
import type { MyOrderSummary } from "@/entities/order";
import type { PaymentMethod } from "@/entities/transaction";
import { formatOrderCode, formatVND } from "@/lib/format";
import { paymentResultOf, type PaymentResultKind } from "../payment-result";
import { RetryPaymentButton } from "./RetryPaymentButton";
import styles from "./PaymentResult.module.css";

const METHOD_LABEL: Record<PaymentMethod, string> = { cod: "COD", payos: "PayOS / VietQR" };

const VIEW: Record<PaymentResultKind, { title: string; tone: "success" | "pending" | "failed"; icon: ReactNode }> = {
  cod_placed: { title: "Đã đặt hàng", tone: "success", icon: <CheckIcon size={20} /> },
  paid: { title: "Thanh toán thành công", tone: "success", icon: <CheckIcon size={20} /> },
  pending: { title: "Đang xác nhận thanh toán", tone: "pending", icon: <ClockIcon size={20} /> },
  failed: { title: "Thanh toán chưa hoàn tất", tone: "failed", icon: <CloseIcon size={20} /> },
};

function leadOf(kind: PaymentResultKind, total: string, code: string): string {
  switch (kind) {
    case "cod_placed":
      return `Bạn thanh toán ${total} khi nhận đơn ${code}.`;
    case "paid":
      return `NexTech đã xác nhận thanh toán cho đơn ${code}.`;
    case "pending":
      return "NexTech đang kiểm tra giao dịch. Bạn có thể xem trạng thái mới nhất trong Chi tiết đơn hàng.";
    case "failed":
      return "Giao dịch chưa được xác nhận. Bạn có thể kiểm tra đơn hoặc thử thanh toán lại.";
  }
}

export function PaymentResult({ order }: { order: MyOrderSummary }) {
  const kind = paymentResultOf(order);
  const view = VIEW[kind];
  const code = formatOrderCode(order.id);
  const total = formatVND(order.total);

  return (
    <main className={styles.page}>
      <Breadcrumbs items={[{ label: "Đặt hàng", href: routes.checkout }, { label: "Kết quả thanh toán" }]} />
      <section className={styles.card} aria-labelledby="result-title">
        <span className={`${styles.icon} ${styles[view.tone]}`}>{view.icon}</span>
        <h1 id="result-title" className={styles.title}>
          {view.title}
        </h1>
        <p className={styles.lead}>{leadOf(kind, total, code)}</p>
        <dl className={styles.details}>
          <div className={styles.row}>
            <dt>Mã đơn hàng</dt>
            <dd>{code}</dd>
          </div>
          <div className={styles.row}>
            <dt>Số tiền</dt>
            <dd>{total}</dd>
          </div>
          <div className={styles.row}>
            <dt>Phương thức</dt>
            <dd>{METHOD_LABEL[order.payment_method]}</dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <Link href={routes.orderDetail(order.id)} className={styles.primary}>
            <ArrowRightIcon /> Xem đơn hàng
          </Link>
          {kind === "failed" ? (
            <RetryPaymentButton orderId={order.id} />
          ) : (
            <Link href={routes.home} className={styles.secondary}>
              Tiếp tục mua sắm
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
