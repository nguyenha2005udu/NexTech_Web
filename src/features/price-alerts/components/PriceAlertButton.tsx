"use client";

// FDD 6.1.1 — Nút "Theo dõi giá" + modal "Tạo cảnh báo giá" (Figma 01.05, 01.06)
import { useState, useTransition } from "react";
import Image from "next/image";
import { App, Button, Form, InputNumber, Modal } from "antd";
import { BellIcon, CloseIcon } from "@/components/ui/icons";
import { formatNumber, formatVND } from "@/lib/format";
import { zodRule } from "@/lib/zod-rule";
import { createPriceAlert } from "../actions";
import { targetPriceSchema } from "../schemas";
import styles from "./price-alerts.module.css";

type Props = {
  productId: string;
  productName: string;
  summary: string;
  imageSrc?: string;
  price: number;
};

const STEP = 1_000_000;

export function PriceAlertButton({ productId, productName, summary, imageSrc, price }: Props) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ targetPrice: number }>();
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  const close = () => setOpen(false);

  function submit({ targetPrice }: { targetPrice: number }) {
    startTransition(async () => {
      const result = await createPriceAlert({ productId, targetPrice });
      if (result.ok) {
        message.success("Đã tạo cảnh báo giá");
        close();
      } else {
        message.warning(result.message);
      }
    });
  }

  return (
    <>
      <Button icon={<BellIcon />} className={styles.trigger} onClick={() => setOpen(true)}>
        Theo dõi giá
      </Button>
      <Modal
        open={open}
        onCancel={close}
        title="Tạo cảnh báo giá"
        closeIcon={<CloseIcon />}
        width={510}
        centered
        destroyOnHidden
        className={styles.modal}
        footer={[
          <Button key="cancel" onClick={close}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" icon={<BellIcon />} loading={pending} onClick={() => form.submit()}>
            Tạo cảnh báo
          </Button>,
        ]}
      >
        <div className={styles.product}>
          <span className={styles.thumb}>
            {imageSrc ? <Image src={imageSrc} alt="" width={66} height={50} /> : null}
          </span>
          <div>
            <p className={styles.productName}>{productName}</p>
            <p className={styles.productMeta}>{summary} · SL 1</p>
          </div>
        </div>
        <p className={styles.lead}>NexTech sẽ thông báo khi giá bằng hoặc thấp hơn mức bạn đặt.</p>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ targetPrice: Math.max(price - STEP, 0) }}
          onFinish={submit}
          className={styles.form}
        >
          <Form.Item
            name="targetPrice"
            label="Giá mục tiêu"
            rules={[zodRule(targetPriceSchema(price))]}
            extra={`Giá hiện tại ${formatVND(price)}`}
          >
            <InputNumber<number>
              autoFocus
              min={0}
              step={100_000}
              controls={false}
              inputMode="numeric"
              formatter={(v) => (v ? `${formatNumber(Number(v))} ₫` : "")}
              parser={(v) => Number((v ?? "").replace(/\D/g, ""))}
              className={styles.input}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
