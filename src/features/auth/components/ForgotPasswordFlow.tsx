"use client";

// FDD 1.1.5 — Quên mật khẩu: Email → OTP → chuyển sang /reset-password (Figma 05.05–05.06)
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { AuthHeading } from "./AuthHeading";
import { EmailStepForm } from "./EmailStepForm";
import { OtpStepForm } from "./OtpStepForm";
import { StepIndicator } from "./StepIndicator";
import styles from "./auth.module.css";

export function ForgotPasswordFlow() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);

  if (editing || !email) {
    return (
      <>
        <AuthHeading title="Quên mật khẩu" subtitle="Nhập email đã dùng để đăng ký NexTech." />
        <div className={styles.body}>
          <StepIndicator current={1} />
          <EmailStepForm
            purpose="reset-password"
            defaultEmail={email ?? undefined}
            onSent={(value) => {
              setEmail(value);
              setEditing(false);
            }}
          />
        </div>
        <p className={styles.footer}>
          <Link href={routes.login} className={styles.link}>
            Quay lại đăng nhập
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Xác thực mã OTP" subtitle="Nhập mã 6 số để xác minh yêu cầu đặt lại mật khẩu." />
      <div className={styles.body}>
        <StepIndicator current={2} />
        <OtpStepForm
          email={email}
          purpose="reset-password"
          onChangeEmail={() => setEditing(true)}
          onVerified={(token) => {
            const query = new URLSearchParams({ token: token ?? "" });
            router.push(`${routes.resetPassword}?${query.toString()}`);
          }}
        />
      </div>
    </>
  );
}
