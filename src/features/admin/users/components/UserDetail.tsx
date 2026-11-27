"use client";

// FDD 8.4 — Drawer chi tiết người dùng (design/admin/07 §2). Mở theo ?view=<id>; đóng = bỏ ?view.
// Khối "Tài khoản" sửa được vai trò + trạng thái (trừ khi xem chính mình — ✅Q-U3); khối "Hồ sơ mua sắm" chỉ đọc.
import { useEffect } from "react";
import { App, Descriptions, Drawer, Empty, Tag, Tooltip } from "antd";
import type { DescriptionsProps } from "antd";
import { userRoleMeta, userStatusMeta, type AdminUserDetail } from "@/entities/user";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatDate, formatUserCode } from "@/lib/format";
import { isSelf } from "../user.rules";
import { AccountStatusToggle } from "./AccountStatusToggle";
import { RoleSelect } from "./RoleSelect";
import { UserAvatar } from "./UserAvatar";
import styles from "./users.module.css";

const dash = (value: string | null) => value || "—";

function accountItems(u: AdminUserDetail, self: boolean): DescriptionsProps["items"] {
  const role = userRoleMeta(u.role);
  const status = userStatusMeta(u.is_active);
  return [
    {
      key: "code",
      label: "Mã người dùng",
      children: (
        <Tooltip title={u.id}>
          <span>{formatUserCode(u.id)}</span>
        </Tooltip>
      ),
    },
    { key: "phone", label: "Số điện thoại", children: dash(u.phone_number) },
    {
      key: "role",
      label: "Vai trò",
      children: self ? (
        <Tag color={role.color} variant="solid">
          {role.label}
        </Tag>
      ) : (
        <RoleSelect user={u} />
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      children: (
        <span className={styles.statusCell}>
          <Tag color={status.color} variant="solid">
            {status.label}
          </Tag>
          {!self && <AccountStatusToggle user={u} variant="button" />}
        </span>
      ),
    },
    { key: "created_at", label: "Ngày tạo", children: formatDate(u.created_at) },
  ];
}

function profileItems(profile: NonNullable<AdminUserDetail["profile"]>): DescriptionsProps["items"] {
  return [
    { key: "segment", label: "Nhóm khách hàng", children: dash(profile.user_segment) },
    { key: "occupation", label: "Nghề nghiệp", children: dash(profile.occupation) },
    { key: "age", label: "Độ tuổi", children: dash(profile.age_range) },
    {
      key: "interests",
      label: "Sở thích",
      children:
        profile.interests.length > 0 ? (
          <span className={styles.interests}>
            {profile.interests.map((interest) => (
              <Tag key={interest}>{interest}</Tag>
            ))}
          </span>
        ) : (
          "—"
        ),
    },
  ];
}

const DESCRIPTIONS_PROPS = {
  className: styles.descriptions,
  column: 1,
  size: "small",
  colon: false,
  classNames: { label: styles.label, content: styles.value },
} as const;

export interface UserDetailProps {
  /** `null` khi không có ?view hoặc không tìm thấy người dùng. */
  user: AdminUserDetail | null;
  /** Id admin đang đăng nhập. */
  currentUserId: string;
  /** URL có ?view hợp lệ nhưng backend trả 404 (NT-IDN-1003) → báo rồi bỏ ?view. */
  notFound?: boolean;
}

export function UserDetail({ user, currentUserId, notFound = false }: Readonly<UserDetailProps>) {
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();

  useEffect(() => {
    if (!notFound) return;
    message.warning("Không tìm thấy người dùng");
    setParams({ view: undefined });
  }, [notFound, message, setParams]);

  if (!user) return null;
  const self = isSelf(user.id, currentUserId);

  return (
    <Drawer
      open
      placement="right"
      size={420}
      title={`Người dùng: ${user.full_name}`}
      onClose={() => setParams({ view: undefined })}
      destroyOnHidden
    >
      <div className={styles.header}>
        <UserAvatar name={user.full_name} src={user.avatar_url} size={56} />
        <div className={styles.personText}>
          <span className={styles.headerName}>{user.full_name}</span>
          {user.email && <span className={styles.muted}>{user.email}</span>}
        </div>
      </div>

      <h3 className={styles.sectionLabel}>Tài khoản</h3>
      <Descriptions {...DESCRIPTIONS_PROPS} items={accountItems(user, self)} />
      {self && <p className={styles.selfNote}>Không thể tự đổi vai trò hoặc khoá tài khoản của mình.</p>}

      <h3 className={styles.sectionLabel}>Hồ sơ mua sắm</h3>
      {user.profile ? (
        <Descriptions {...DESCRIPTIONS_PROPS} items={profileItems(user.profile)} />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Người dùng chưa khai báo hồ sơ mua sắm" />
      )}
    </Drawer>
  );
}
