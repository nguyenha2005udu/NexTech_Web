"use client";

// FDD 4.2.2 — Hộp "Chọn mã giảm giá" (Figma 03.06): gõ mã hoặc chọn mã gợi ý. Backend cho dùng đồng thời 1 mã giảm
// đơn hàng + 1 mã miễn phí vận chuyển nên mỗi loại có một nhóm chọn riêng. Điều kiện dùng mã kiểm bằng couponProblem
// (cùng logic với server); mã gõ tay không có trong danh sách sẽ báo không tồn tại.
import { useState } from "react";
import { Button, Input, Modal, Radio } from "antd";
import type { Coupon, CouponCategory } from "@/entities/coupon";
import { couponProblem } from "../pricing";
import styles from "./Checkout.module.css";

type Props = {
  open: boolean;
  coupons: Coupon[];
  subtotal: number;
  selectedCodes: string[];
  onSelect: (codes: string[]) => void;
  onClose: () => void;
};

type Draft = Record<CouponCategory, string | null>;

const GROUPS: ReadonlyArray<{ category: CouponCategory; title: string }> = [
  { category: "order", title: "Mã giảm giá đơn hàng" },
  { category: "free_shipping", title: "Mã miễn phí vận chuyển" },
];

function draftFrom(coupons: Coupon[], codes: string[]): Draft {
  const draft: Draft = { order: null, free_shipping: null };
  for (const code of codes) {
    const c = coupons.find((x) => x.code === code);
    if (c) draft[c.category] = c.code;
  }
  return draft;
}

export function CouponPicker({ open, coupons, subtotal, selectedCodes, onSelect, onClose }: Props) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(coupons, selectedCodes));
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  // Mở hộp → nháp từ mã đang dùng, xoá ô nhập và lỗi cũ. Đặt lại ngay khi `open` đổi (như AddressPicker).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(draftFrom(coupons, selectedCodes));
      setTyped("");
      setError(null);
    }
  }
  const now = new Date();
  const chosen = Object.values(draft).filter((c): c is string => c !== null);

  function applyTyped() {
    const code = typed.trim().toUpperCase();
    if (!code) return;
    const coupon = coupons.find((c) => c.code === code);
    const problem = coupon ? couponProblem(coupon, subtotal, now) : "Mã giảm giá không tồn tại";
    setError(problem);
    if (coupon && !problem) {
      setDraft((d) => ({ ...d, [coupon.category]: coupon.code }));
      setTyped("");
    }
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
            onSelect(chosen);
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
      {GROUPS.map(({ category, title }) => {
        const options = coupons.filter((c) => c.category === category);
        if (!options.length) return null;
        return (
          <section key={category} aria-label={title}>
            <h3 className={styles.strong}>{title}</h3>
            <Radio.Group
              value={draft[category]}
              onChange={(e) => setDraft((d) => ({ ...d, [category]: e.target.value as string }))}
              className={styles.options}
            >
              {options.map((c) => {
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
            {draft[category] ? (
              <Button type="link" onClick={() => setDraft((d) => ({ ...d, [category]: null }))}>
                Bỏ chọn {title.toLowerCase()}
              </Button>
            ) : null}
          </section>
        );
      })}
    </Modal>
  );
}
