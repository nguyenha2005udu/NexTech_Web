"use client";

// FDD 8.4.4 — Khoá / mở khoá tài khoản (design/admin/07 §3.1). Dùng ở cột THAO TÁC và trong Drawer.
// Luôn hỏi lại bằng Popconfirm. Backend thu hồi refresh token khi khoá → phiên đang mở hết hạn trong ≤ 15 phút.
import { App, Button, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import type { AdminUserListItem } from "@/entities/user";
import { updateUser } from "../actions";
import styles from "./users.module.css";

export interface AccountStatusToggleProps {
  user: Pick<AdminUserListItem, "id" | "full_name" | "is_active">;
  /** `link` trong bảng; `button` trong Drawer. */
  variant?: "link" | "button";
}

export function AccountStatusToggle({ user, variant = "link" }: Readonly<AccountStatusToggleProps>) {
  const { message } = App.useApp();
  const router = useRouter();
  const lock = user.is_active;

  async function confirm() {
    const result = await updateUser({ id: user.id, is_active: !lock });
    if (result.ok) {
      // revalidatePath trong action làm mới bảng + Drawer
      message.success(lock ? "Đã khoá tài khoản" : "Đã mở khoá tài khoản");
      return;
    }
    // NT-IDN-1003 (người dùng đã bị xoá): tải lại để bảng khớp backend
    message.warning(result.message);
    router.refresh();
  }

  const text = lock ? "Khoá" : "Mở khoá";
  const label = `${text} tài khoản ${user.full_name}`;
  const trigger =
    variant === "button" ? (
      <Button size="small" danger={lock} aria-label={label}>
        {lock ? "Khoá tài khoản" : "Mở khoá"}
      </Button>
    ) : (
      <Button
        type="link"
        danger={lock}
        className={lock ? styles.linkButton : `${styles.linkButton} ${styles.unlock}`}
        aria-label={label}
      >
        {text}
      </Button>
    );

  return (
    <Popconfirm
      title={lock ? `Khoá tài khoản ${user.full_name}?` : `Mở khoá tài khoản ${user.full_name}?`}
      description={lock ? "Người dùng sẽ bị đăng xuất trong tối đa 15 phút và không đăng nhập lại được." : undefined}
      okText={text}
      okButtonProps={{ danger: lock }}
      cancelText="Huỷ"
      onConfirm={confirm}
    >
      {trigger}
    </Popconfirm>
  );
}
