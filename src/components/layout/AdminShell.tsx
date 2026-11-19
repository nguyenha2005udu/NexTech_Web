"use client";

// FDD 7, 8 — Khung khu quản trị (design/admin/00 §2): Sider navy + Header trắng + nội dung nền xám.
// Là Client Component vì dùng Layout/ConfigProvider của antd; trang con (Server Component) đi qua `children`.
import type { ReactNode } from "react";
import Link from "next/link";
import { ConfigProvider, Layout, Tag } from "antd";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { adminTheme } from "@/config/theme";
import { ShoppingBagIcon } from "@/components/ui/icons";
import { AdminHeader, type AdminShellUser } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import styles from "./AdminShell.module.css";

const SIDER_WIDTH = 176;

export function AdminShell({ user, children }: Readonly<{ user: AdminShellUser; children: ReactNode }>) {
  return (
    <ConfigProvider theme={adminTheme}>
      <Layout className={styles.shell}>
        <Layout.Sider width={SIDER_WIDTH} className={styles.sider}>
          <Link href={routes.admin.dashboard} className={styles.brand}>
            <ShoppingBagIcon size={18} />
            {siteConfig.name}
            <Tag color="blue" variant="solid" className={styles.brandBadge}>
              Admin
            </Tag>
          </Link>
          <AdminSidebar />
        </Layout.Sider>
        <Layout>
          <AdminHeader user={user} />
          <Layout.Content className={styles.content}>{children}</Layout.Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
