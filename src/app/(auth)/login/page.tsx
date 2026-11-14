// FDD 1.1.2–1.1.4 — Đăng nhập email / Google / Facebook (Figma 05.01). SSG, form là Client Component.
import type { Metadata } from "next";
import { AuthBody, AuthFooter, AuthHeading, LoginForm, SocialLogin } from "@/features/auth";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function Page() {
  return (
    <>
      <AuthHeading title="Đăng nhập" subtitle="Chào mừng bạn quay lại" />
      <AuthBody>
        <LoginForm />
      </AuthBody>
      <SocialLogin />
      <AuthFooter text="Chưa có tài khoản?" href={routes.register} linkLabel="Đăng ký ngay" />
    </>
  );
}
