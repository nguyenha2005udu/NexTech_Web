"use client";

// FDD 4.2.2 — Hộp "Chọn mã giảm giá" (Figma 03.06): gõ mã hoặc chọn mã gợi ý. Điều kiện dùng mã kiểm bằng
// couponProblem (cùng logic với server); mã gõ tay không có trong danh sách sẽ được server kiểm khi đặt hàng.
import { useState } from "react";
import { Button, Input, Modal, Radio } from "antd";
import type { Coupon } from "@/entities/coupon";
import { couponProblem } from "../pricing";
import styles from "./Checkout.module.css";

type Props = {
  open: boolean;
  coupons: Coupon[];
  subtotal: number;
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
  onClose: () => void;
};

export function CouponPicker({ open, coupons, subtotal, selectedCode, onSelect, onClose }: Props) {
  const [draft, setDraft] = useState(selectedCode);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  // Mở hộp → nháp từ mã đang dùng, xoá ô nhập và lỗi cũ. Đặt lại ngay khi `open` đổi (như AddressPicker).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(selectedCode);
      setTyped("");
      setError(null);
    }
  }
  const now = new Date();

  function applyTyped() {
    const code = typed.trim().toUpperCase();
    if (!code) return;
    const coupon = coupons.find((c) => c.code === code);
    const problem = coupon ? couponProblem(coupon, subtotal, now) : "Mã giảm giá không tồn tại";
    setError(problem);
    if (!problem) setDraft(code);
  }

  return (
    <Modal
      open={open}
      title="Chọn mã giảm giá"
      onCancel={onClose}
      centered
      footer={[
        <Button key="back" onClick={onClose}>
          Quay lại
        </Button>,
        <Button
          key="ok"
          type="primary"
          onClick={() => {
            onSelect(draft);
            onClose();
          }}
        >
          Xác nhận
        </Button>,
      ]}
    >
      <div className={styles.codeInput}>
        <Input
          aria-label="Nhập mã giảm giá"
          placeholder="Nhập mã giảm giá"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onPressEnter={applyTyped}
        />
        <Button onClick={applyTyped}>Áp dụng</Button>
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <Radio.Group value={draft} onChange={(e) => setDraft(e.target.value as string)} className={styles.options}>
        {coupons.map((c) => {
          const problem = couponProblem(c, subtotal, now);
          return (
            <Radio key={c.code} value={c.code} disabled={problem !== null} className={styles.option}>
              <span className={styles.strong}>{c.code}</span>
              <br />
              <span className={styles.muted}>{problem ?? c.description}</span>
            </Radio>
          );
        })}
      </Radio.Group>
      {draft ? (
        <Button type="link" onClick={() => setDraft(null)}>
          Bỏ chọn mã
        </Button>
      ) : null}
    </Modal>
  );
}
