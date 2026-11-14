// FDD 8.4 / mục 10.2 — Không có quyền truy cập (Figma 05.08)
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/AuthShell";
import { routes } from "@/config/routes";
import { AuthBody, AuthFooter, AuthHeading, ForbiddenPanel } from "@/features/auth";

export const metadata: Metadata = {
  title: "Không có quyền truy cập",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthShell>
      <AuthHeading
        title="Bạn chưa có quyền truy cập"
        subtitle="Quay lại trang chủ hoặc đăng nhập bằng tài khoản có quyền truy cập."
      />
      <AuthBody>
        <ForbiddenPanel />
      </AuthBody>
      <AuthFooter href={routes.login} linkLabel="Đăng nhập bằng tài khoản khác" />
    </AuthShell>
  );
}
