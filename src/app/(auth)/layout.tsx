import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthShell } from "@/components/layout/AuthShell";

// Đã đăng nhập → proxy.ts redirect về trang chủ (giữ trang SSG, không đọc cookie ở đây).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthShell>{children}</AuthShell>;
}
