"use client";

// FDD 7, 8 — Menu khu quản trị (design/admin/00 §2.2 L3). Mục đang chọn tính từ pathname.
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "antd";
import { adminNav, findAdminNavItem, type AdminNavKey } from "@/config/admin-nav";
import {
  ArchiveIcon,
  CreditCardIcon,
  DashboardIcon,
  ReceiptIcon,
  ShapesIcon,
  TagIcon,
  UsersIcon,
} from "@/components/ui/icons";
import styles from "./AdminShell.module.css";

const ICONS: Record<AdminNavKey, ComponentType<{ size?: number }>> = {
  dashboard: DashboardIcon,
  categories: ShapesIcon,
  products: ArchiveIcon,
  orders: ReceiptIcon,
  coupons: TagIcon,
  transactions: CreditCardIcon,
  users: UsersIcon,
};

const ITEMS = adminNav.map((item) => {
  const Icon = ICONS[item.key];
  return { key: item.key, icon: <Icon size={16} />, label: <Link href={item.href}>{item.label}</Link> };
});

export function AdminSidebar() {
  const active = findAdminNavItem(usePathname());
  return (
    <nav aria-label="Menu quản trị">
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={active ? [active.key] : []}
        items={ITEMS}
        className={styles.menu}
      />
    </nav>
  );
}
