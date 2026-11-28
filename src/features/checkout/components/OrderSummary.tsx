// FDD 4.2 + 5.1.1 — "Tóm tắt đơn hàng" (Figma 03.04, 03.07). Số hiển thị tính ở client bằng pricing.ts;
// placeOrder tính lại ở server với giá thật trước khi tạo đơn (mục 5).
import { Button } from "antd";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { PaymentMethod } from "@/entities/transaction";
import { formatVND } from "@/lib/format";
import type { OrderPricing } from "../pricing";
import styles from "./Checkout.module.css";

type Props = {
  pricing: OrderPricing;
  paymentMethod: PaymentMethod;
  disabled: boolean;
  submitting: boolean;
  onSubmit: () => void;
};

export function OrderSummary({ pricing, paymentMethod, disabled, submitting, onSubmit }: Props) {
  return (
    <aside className={styles.card} aria-labelledby="order-summary-title">
      <h2 id="order-summary-title" className={styles.cardTitle}>
        Tóm tắt đơn hàng
      </h2>
      <dl className={styles.summaryRows}>
        <div className={styles.summaryRow}>
          <dt>Tạm tính</dt>
          <dd>{formatVND(pricing.subtotal)}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt>Phí vận chuyển</dt>
          <dd>{pricing.shippingFee === 0 && pricing.subtotal > 0 ? "Miễn phí" : formatVND(pricing.shippingFee)}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt>Giảm giá</dt>
          <dd>{pricing.discount ? `−${formatVND(pricing.discount)}` : formatVND(0)}</dd>
        </div>
      </dl>
      <p className={styles.totalRow}>
        Tổng cộng <span className={styles.total}>{formatVND(pricing.total)}</span>
      </p>
      <Button
        type="primary"
        block
        size="large"
        icon={<ArrowRightIcon />}
        iconPlacement="end"
        disabled={disabled}
        loading={submitting}
        onClick={onSubmit}
      >
        {paymentMethod === "payos" ? "Tiếp tục đến PayOS" : "Đặt hàng"}
      </Button>
      <p className={styles.summaryNote}>Kiểm tra lại địa chỉ và phương thức thanh toán trước khi xác nhận.</p>
    </aside>
  );
}
