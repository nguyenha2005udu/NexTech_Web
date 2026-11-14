import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthShell } from "@/components/layout/AuthShell";

// TODO(auth): đã đăng nhập → redirect về trang chủ (cần Auth.js — Sprint 2).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthShell>{children}</AuthShell>;
}
