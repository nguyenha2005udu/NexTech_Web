"use client";

// FDD 6.1.1 — Đặt giá mục tiêu ở trang chi tiết sản phẩm. Trang là ISR nên không đọc phiên ở đây:
// khách bấm "Gửi" sẽ bị Server Action chuyển tới /login (mục 10.3 lớp 3).
import { useState, useTransition } from "react";
import Link from "next/link";
import { App, Button, InputNumber, Modal } from "antd";
import { BellIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { formatNumber, formatVND } from "@/lib/format";
import { createPriceAlert } from "../actions";
import styles from "./PriceAlerts.module.css";

type Props = { productId: string; productName: string; price: number };

export function PriceAlertButton({ productId, productName, price }: Props) {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function submit() {
    if (target === null) {
      setError("Nhập giá mục tiêu");
      return;
    }
    if (target >= price) {
      setError(`Giá mục tiêu phải thấp hơn giá hiện tại (${formatVND(price)})`);
      return;
    }
    startTransition(async () => {
      const result = await createPriceAlert({ productId, targetPrice: target });
      if (!result.ok) {
        setError(result.fieldErrors?.targetPrice ?? result.message);
        return;
      }
      message.success(
        <span>
          Đã theo dõi giá {productName}.{" "}
          <Link href={routes.priceAlerts} className={styles.link}>
            Xem cảnh báo giá
          </Link>
        </span>,
      );
      close();
    });
  }

  return (
    <>
      <Button icon={<BellIcon />} onClick={() => setOpen(true)}>
        Theo dõi giá
      </Button>
      <Modal
        open={open}
        title="Cảnh báo giá"
        okText="Đặt cảnh báo"
        cancelText="Hủy"
        confirmLoading={pending}
        onOk={submit}
        onCancel={close}
        destroyOnHidden
      >
        <p className={styles.hint}>
          Giá hiện tại của {productName} là {formatVND(price)}. Chúng tôi sẽ thông báo khi giá giảm tới mức bạn đặt.
        </p>
        <label htmlFor="price-alert-target" className={styles.strong}>
          Giá mục tiêu (₫)
        </label>
        <InputNumber<number>
          id="price-alert-target"
          className={styles.field}
          min={1}
          step={100_000}
          value={target}
          onChange={(v) => {
            setTarget(v);
            setError(null);
          }}
          formatter={(v) => (v ? formatNumber(Number(v)) : "")}
          parser={(v) => Number((v ?? "").replace(/\D/g, ""))}
          status={error ? "error" : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "price-alert-error" : undefined}
        />
        {error ? (
          <p id="price-alert-error" role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
