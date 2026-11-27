"use client";

// FDD 8.4 — Bảng người dùng (design/admin/07 §1.3). Header dính + thân cuộn như các màn admin khác.
// "Xem" mở Drawer qua ?view=<id>. Dòng của chính admin không có nút Khoá (✅Q-U3).
import { Button, Table, Tag } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { userRoleMeta, userStatusMeta, type AdminUserListItem } from "@/entities/user";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatDate, formatNumber } from "@/lib/format";
import { isSelf } from "../user.rules";
import { AccountStatusToggle } from "./AccountStatusToggle";
import { UserAvatar } from "./UserAvatar";
import styles from "./users.module.css";

function ViewButton({ user }: Readonly<{ user: AdminUserListItem }>) {
  const { setParams } = useAdminListParams();
  return (
    <Button
      type="link"
      className={styles.linkButton}
      aria-label={`Xem người dùng ${user.full_name}`}
      onClick={() => setParams({ view: user.id })}
    >
      Xem
    </Button>
  );
}

function buildColumns(currentUserId: string): TableColumnsType<AdminUserListItem> {
  return [
    {
      title: "NGƯỜI DÙNG",
      key: "user",
      width: 280,
      render: (_: unknown, u) => (
        <span className={styles.person}>
          <UserAvatar name={u.full_name} src={u.avatar_url} />
          <span className={styles.personText}>
            <span className={styles.name}>
              {u.full_name}
              {isSelf(u.id, currentUserId) && <span className={styles.muted}> (Bạn)</span>}
            </span>
            {u.email && <span className={`${styles.muted} ${styles.small}`}>{u.email}</span>}
          </span>
        </span>
      ),
    },
    {
      title: "SỐ ĐIỆN THOẠI",
      dataIndex: "phone_number",
      key: "phone_number",
      width: 140,
      render: (phone: string | null) => phone ?? "—",
    },
    {
      title: "VAI TRÒ",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (role: string) => {
        const meta = userRoleMeta(role);
        return (
          <Tag color={meta.color} variant="solid">
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "is_active",
      key: "is_active",
      width: 130,
      render: (isActive: boolean) => {
        const meta = userStatusMeta(isActive);
        return (
          <Tag color={meta.color} variant="solid">
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (createdAt: string) => <span className={styles.muted}>{formatDate(createdAt)}</span>,
    },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right",
      width: 150,
      fixed: "right",
      render: (_: unknown, u) => (
        <span className={styles.actions}>
          <ViewButton user={u} />
          {!isSelf(u.id, currentUserId) && <AccountStatusToggle user={u} />}
        </span>
      ),
    },
  ];
}

export interface UserTableProps {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
  /** Id admin đang đăng nhập — để đánh dấu "(Bạn)" và ẩn nút Khoá. */
  currentUserId: string;
}

export function UserTable({ items, total, page, pageSize, currentUserId }: Readonly<UserTableProps>) {
  const { setParams } = useAdminListParams();

  const onChange: TableProps<AdminUserListItem>["onChange"] = (pagination, _filters, _sorter, extra) => {
    if (extra.action === "paginate") setParams({ page: pagination.current });
  };

  return (
    <Table<AdminUserListItem>
      rowKey="id"
      columns={buildColumns(currentUserId)}
      dataSource={items}
      size="middle"
      sticky
      scroll={{ x: "max-content", y: "calc(100vh - 260px)" }}
      locale={{ emptyText: "Không có dữ liệu phù hợp" }}
      onChange={onChange}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        hideOnSinglePage: true,
        showTotal: (n) => `${formatNumber(n)} người dùng`,
      }}
    />
  );
}
