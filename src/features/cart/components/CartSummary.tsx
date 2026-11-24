// FDD 4.1 — "Tóm tắt giỏ hàng" (Figma 03.01). Chỉ hiển thị; phí giao & giảm giá tính ở checkout,
// và tổng tiền thật do server tính lại khi đặt hàng (mục 5).
import { Button } from "antd";
import { ArrowRightIcon } from "@/components/ui/icons";
import { formatVND } from "@/lib/format";
import styles from "./CartPage.module.css";

type Props = {
  subtotal: number;
  selectedCount: number;
  onCheckout: () => void;
  checkingOut?: boolean;
};

export function CartSummary({ subtotal, selectedCount, onCheckout, checkingOut = false }: Props) {
  return (
    <aside className={styles.card} aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title" className={styles.summaryTitle}>
        Tóm tắt giỏ hàng
      </h2>
      <dl>
        <div className={styles.summaryRow}>
          <dt>Tạm tính</dt>
          <dd>{formatVND(subtotal)}</dd>
        </div>
      </dl>
      <p className={styles.summaryNote}>Phí giao hàng và mã giảm giá được tính ở bước đặt hàng.</p>
      <p className={styles.totalRow}>
        Tổng cộng <span className={styles.total}>{formatVND(subtotal)}</span>
      </p>
      <Button
        type="primary"
        block
        size="large"
        icon={<ArrowRightIcon />}
        iconPlacement="end"
        disabled={selectedCount === 0}
        loading={checkingOut}
        onClick={onCheckout}
      >
        Tiến hành đặt hàng
      </Button>
    </aside>
  );
}
