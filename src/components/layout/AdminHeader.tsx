"use client";

// Header khu quản trị (design/admin/00 §2.2 L4–L6): tiêu đề trang · "Về trang bán hàng" · Avatar + menu tài khoản.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Dropdown, Layout } from "antd";
import type { MenuProps } from "antd";
import { findAdminNavItem } from "@/config/admin-nav";
import { routes } from "@/config/routes";
import { LogOutIcon, StoreIcon } from "@/components/ui/icons";
import { LogoutButton } from "@/features/auth";
import styles from "./AdminShell.module.css";

export interface AdminShellUser {
  name: string;
  email: string;
  avatarUrl: string | null;
}

/** Chữ cái đầu của tên gọi (từ cuối trong tên tiếng Việt): "Nguyễn Văn An" → "A". */
export function avatarInitial(name: string): string {
  const given = name.trim().split(/\s+/).pop() ?? "";
  return given.charAt(0).toLocaleUpperCase("vi-VN") || "?";
}

export function AdminHeader({ user }: { user: AdminShellUser }) {
  const current = findAdminNavItem(usePathname());

  const items: MenuProps["items"] = [
    {
      key: "account",
      disabled: true,
      label: (
        <span className={styles.account}>
          <span className={styles.accountName}>{user.name}</span>
          <span className={styles.accountEmail}>{user.email}</span>
        </span>
      ),
    },
    { type: "divider" },
    {
      key: "logout",
      label: (
        <LogoutButton className={styles.logout}>
          <LogOutIcon size={15} /> Đăng xuất
        </LogoutButton>
      ),
    },
  ];

  return (
    <Layout.Header className={styles.header}>
      <h1 className={styles.title}>{current?.title ?? "Quản trị"}</h1>
      <div className={styles.actions}>
        <Link href={routes.home} className={styles.storeLink}>
          <StoreIcon size={15} />
          <span className={styles.storeLabel}>Về trang bán hàng</span>
        </Link>
        <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
          <button type="button" className={styles.avatarButton} aria-label={`Tài khoản: ${user.name}`}>
            <Avatar src={user.avatarUrl ?? undefined} className={styles.avatar}>
              {avatarInitial(user.name)}
            </Avatar>
          </button>
        </Dropdown>
      </div>
    </Layout.Header>
  );
}
