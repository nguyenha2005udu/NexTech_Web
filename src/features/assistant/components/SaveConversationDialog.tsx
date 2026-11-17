"use client";

import { Modal } from "antd";
import { CheckIcon } from "@/components/ui/icons";
import styles from "./Assistant.module.css";

// FDD 3.3 — Hỏi lưu hội thoại của khách vào tài khoản sau khi đăng nhập (Figma 02.03).
export function SaveConversationDialog({
  open,
  title,
  onSave,
  onSkip,
}: {
  open: boolean;
  title: string;
  onSave: () => void;
  onSkip: () => void;
}) {
  return (
    <Modal
      open={open}
      onCancel={onSkip}
      footer={null}
      centered
      width={440}
      title={<span className={styles.dialogTitle}>Lưu hội thoại này?</span>}
    >
      <p className={styles.dialogText}>
        Hội thoại “{title}” đang nằm trong phiên trình duyệt. Lưu vào tài khoản để xem lại trong Lịch sử hội thoại.
      </p>
      <p className={styles.dialogNote}>Bạn có thể bỏ qua, hội thoại tạm sẽ mất khi đóng trình duyệt.</p>
      <div className={styles.dialogActions}>
        <button type="button" className={styles.outlineBtn} onClick={onSkip}>
          Để sau
        </button>
        <button type="button" className={styles.primaryBtn} onClick={onSave}>
          <CheckIcon size={16} /> Lưu hội thoại
        </button>
      </div>
    </Modal>
  );
}
