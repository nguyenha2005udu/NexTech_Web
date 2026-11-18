"use client";

// FDD 1.1.5 — Quên mật khẩu: Email → OTP → Mật khẩu mới (Figma 05.05–05.07).
// Backend không cấp token đặt lại: sau khi xác thực OTP, đặt mật khẩu mới theo email trong 10 phút,
// nên cả 3 bước nằm chung một trang (email giữ trong state, không đưa lên URL).
import { useState } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { AuthHeading } from "./AuthHeading";
import { EmailStepForm } from "./EmailStepForm";
import { OtpStepForm } from "./OtpStepForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { StepIndicator, type AuthStep } from "./StepIndicator";
import styles from "./auth.module.css";

export function ForgotPasswordFlow() {
  const [step, setStep] = useState<AuthStep>(1);
  const [email, setEmail] = useState("");

  if (step === 1) {
    return (
      <>
        <AuthHeading title="Quên mật khẩu" subtitle="Nhập email đã dùng để đăng ký NexTech." />
        <div className={styles.body}>
          <StepIndicator current={1} />
          <EmailStepForm
            purpose="reset-password"
            defaultEmail={email}
            onSent={(value) => {
              setEmail(value);
              setStep(2);
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

  if (step === 2) {
    return (
      <>
        <AuthHeading title="Xác thực mã OTP" subtitle="Nhập mã 6 số để xác minh yêu cầu đặt lại mật khẩu." />
        <div className={styles.body}>
          <StepIndicator current={2} />
          <OtpStepForm
            email={email}
            purpose="reset-password"
            onChangeEmail={() => setStep(1)}
            onVerified={() => setStep(3)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Đặt mật khẩu mới" subtitle="Tạo mật khẩu mới để bảo vệ tài khoản NexTech." />
      <div className={styles.body}>
        <StepIndicator current={3} />
        <ResetPasswordForm email={email} />
      </div>
    </>
  );
}
