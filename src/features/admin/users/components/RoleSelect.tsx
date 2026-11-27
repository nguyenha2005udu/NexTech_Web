"use client";

// FDD 8.4 — Đổi vai trò (design/admin/07 §3.2). Chỉ đặt trong Drawer (✅Q-U4). Chọn giá trị khác → hỏi lại.
// Ô chọn lấy giá trị từ props: Huỷ thì giữ giá trị cũ; action xong thì revalidatePath làm mới props.
import { App, Select } from "antd";
import { useRouter } from "next/navigation";
import type { AdminUserListItem, UserRole } from "@/entities/user";
import { updateUser } from "../actions";
import { USER_ROLE_OPTIONS } from "../user.rules";
import styles from "./users.module.css";

export interface RoleSelectProps {
  user: Pick<AdminUserListItem, "id" | "full_name" | "role">;
}

export function RoleSelect({ user }: Readonly<RoleSelectProps>) {
  const { message, modal } = App.useApp();
  const router = useRouter();

  async function apply(role: UserRole) {
    const result = await updateUser({ id: user.id, role });
    if (result.ok) {
      message.success("Đã đổi vai trò");
      return;
    }
    message.warning(result.message);
    router.refresh();
  }

  function onChange(role: UserRole) {
    if (role === user.role) return;
    const promote = role === "admin";
    modal.confirm({
      title: promote ? `Cấp quyền Quản trị cho ${user.full_name}?` : `Gỡ quyền Quản trị của ${user.full_name}?`,
      content: promote ? "Người này sẽ vào được toàn bộ khu quản trị." : "Người này sẽ không vào được khu quản trị nữa.",
      okText: promote ? "Cấp quyền" : "Gỡ quyền",
      okButtonProps: { danger: promote },
      cancelText: "Huỷ",
      onOk: () => apply(role),
    });
  }

  return (
    <Select<UserRole>
      className={styles.roleSelect}
      size="small"
      aria-label={`Vai trò của ${user.full_name}`}
      value={user.role}
      options={[...USER_ROLE_OPTIONS]}
      onChange={onChange}
    />
  );
}
