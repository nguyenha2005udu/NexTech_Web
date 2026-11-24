"use client";

// FDD 4.2.1 — Hộp "Chọn địa chỉ giao hàng" (Figma 03.05). Chọn trong hộp chỉ là nháp, bấm "Dùng địa chỉ này" mới áp.
import { useState } from "react";
import Link from "next/link";
import { Button, Modal, Radio } from "antd";
import { PlusIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import type { Address } from "@/entities/address";
import styles from "./Checkout.module.css";

type Props = {
  open: boolean;
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function AddressPicker({ open, addresses, selectedId, onSelect, onClose }: Props) {
  const [draft, setDraft] = useState(selectedId);
  const [wasOpen, setWasOpen] = useState(open);
  // Mở hộp → bắt đầu nháp từ địa chỉ đang dùng. Đặt lại ngay khi `open` đổi (không đợi hiệu ứng mở xong,
  // nếu không lựa chọn bấm nhanh sẽ bị ghi đè).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(selectedId);
  }

  return (
    <Modal
      open={open}
      title="Chọn địa chỉ giao hàng"
      onCancel={onClose}
      centered
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="ok"
          type="primary"
          disabled={!draft}
          onClick={() => {
            if (draft) onSelect(draft);
            onClose();
          }}
        >
          Dùng địa chỉ này
        </Button>,
      ]}
    >
      <Radio.Group value={draft} onChange={(e) => setDraft(e.target.value as string)} className={styles.options}>
        {addresses.map((a) => (
          <Radio key={a.id} value={a.id} className={styles.option}>
            <span className={styles.strong}>{a.label ?? a.recipient_name}</span>
            <br />
            <span className={styles.muted}>
              {a.recipient_name} · {a.phone_number} — {a.full_address}
            </span>
          </Radio>
        ))}
      </Radio.Group>
      <p className={styles.summaryNote}>
        <Link href={routes.addresses} className={styles.link}>
          <PlusIcon size={14} /> Thêm địa chỉ
        </Link>
      </p>
    </Modal>
  );
}
