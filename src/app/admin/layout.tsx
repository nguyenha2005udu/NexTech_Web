// FDD 7, 8 — Khu quản trị. Bảo vệ lớp 1 ở proxy.ts; lớp 2 ở đây VÀ trong từng page (mục 10.3).
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await requirePermission("admin:access");
  return (
    <AdminShell user={{ name: user.full_name, email: user.email, avatarUrl: user.avatar_url }}>{children}</AdminShell>
  );
}
