// FDD 1.1.5 — Đặt mật khẩu mới (Figma 05.07). SSG: token đọc ở client (useSearchParams) nên bọc Suspense.
import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthBody, AuthHeading, ResetPasswordForm, StepIndicator } from "@/features/auth";

export const metadata: Metadata = { title: "Đặt mật khẩu mới" };

export default function Page() {
  return (
    <>
      <AuthHeading title="Đặt mật khẩu mới" subtitle="Tạo mật khẩu mới để bảo vệ tài khoản NexTech." />
      <AuthBody>
        <StepIndicator current={3} />
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </AuthBody>
    </>
  );
}
