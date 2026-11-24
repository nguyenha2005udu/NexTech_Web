"use client";

// FDD 5.1.1 — Chọn phương thức thanh toán: COD hoặc PayOS / VietQR (Figma 03.04, 03.07).
import { Radio } from "antd";
import { BanknoteIcon, CreditCardIcon } from "@/components/ui/icons";
import type { PaymentMethod } from "@/entities/transaction";
import styles from "./Checkout.module.css";

const METHODS: ReadonlyArray<{ value: PaymentMethod; title: string; hint: string; Icon: typeof BanknoteIcon }> = [
  { value: "cod", title: "Thanh toán khi nhận hàng", hint: "Trả tiền mặt khi nhận hàng", Icon: BanknoteIcon },
  { value: "payos", title: "Chuyển khoản qua PayOS / VietQR", hint: "Quét mã bằng ứng dụng ngân hàng", Icon: CreditCardIcon },
];

type Props = { value: PaymentMethod; onChange: (value: PaymentMethod) => void };

export function PaymentMethodSelect({ value, onChange }: Props) {
  return (
    <Radio.Group
      value={value}
      onChange={(e) => onChange(e.target.value as PaymentMethod)}
      className={styles.methods}
      aria-label="Phương thức thanh toán"
    >
      {METHODS.map(({ value: method, title, hint, Icon }) => (
        <Radio key={method} value={method} className={`${styles.method} ${value === method ? styles.methodActive : ""}`}>
          <span className={styles.methodBody}>
            <span className={styles.methodIcon}>
              <Icon />
            </span>
            <span>
              <span className={styles.strong}>{title}</span>
              <br />
              <span className={styles.muted}>{hint}</span>
            </span>
          </span>
        </Radio>
      ))}
    </Radio.Group>
  );
}
