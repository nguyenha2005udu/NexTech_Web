"use client";

// FDD 1.1.1 — Đăng ký bằng email: Email → Xác thực OTP → Tạo mật khẩu (Figma 05.02–05.04)
import { useState } from "react";
import Link from "next/link";
import { Button, Form, Input } from "antd";
import { UserFieldIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { zodRule } from "@/lib/zod-rule";
import { completeRegistration } from "../actions";
import { useAuthAction } from "../hooks/useAuthAction";
import { fullNameSchema } from "../schemas";
import { AuthHeading } from "./AuthHeading";
import { EmailStepForm } from "./EmailStepForm";
import { NewPasswordFields } from "./NewPasswordFields";
import { OtpStepForm } from "./OtpStepForm";
import { SocialLogin } from "./SocialLogin";
import { StepIndicator, type AuthStep } from "./StepIndicator";
import styles from "./auth.module.css";

export function RegisterFlow() {
  const [step, setStep] = useState<AuthStep>(1);
  const [email, setEmail] = useState("");

  if (step === 1) {
    return (
      <>
        <AuthHeading title="Tạo tài khoản" subtitle="Dùng email để tạo tài khoản NexTech." />
        <div className={styles.body}>
          <StepIndicator current={1} />
          <EmailStepForm
            purpose="register"
            defaultEmail={email}
            onSent={(value) => {
              setEmail(value);
              setStep(2);
            }}
          />
        </div>
        <SocialLogin />
        <p className={styles.footer}>
          Đã có tài khoản?{" "}
          <Link href={routes.login} className={styles.link}>
            Đăng nhập
          </Link>
        </p>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <AuthHeading title="Xác thực email" subtitle={`Nhập mã 6 số gửi tới ${email}.`} />
        <div className={styles.body}>
          <StepIndicator current={2} />
          <OtpStepForm email={email} purpose="register" onChangeEmail={() => setStep(1)} onVerified={() => setStep(3)} />
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Hoàn tất đăng ký" subtitle="Thêm tên hiển thị và tạo mật khẩu cho tài khoản." />
      <div className={styles.body}>
        <StepIndicator current={3} />
        <ProfileStepForm email={email} />
      </div>
    </>
  );
}

function ProfileStepForm({ email }: { email: string }) {
  const [form] = Form.useForm<{ fullName: string; password: string; confirmPassword: string }>();
  const { pending, run } = useAuthAction(form);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.form}
      onFinish={(values) => run(completeRegistration, { ...values, email }, () => undefined)}
    >
      <Form.Item name="fullName" label="Họ và tên" rules={[zodRule(fullNameSchema)]} validateTrigger="onBlur">
        <Input size="large" placeholder="Minh Anh" autoComplete="name" prefix={<UserFieldIcon />} autoFocus />
      </Form.Item>
      <NewPasswordFields />
      <Button type="primary" htmlType="submit" block loading={pending} className={styles.submit}>
        Tạo tài khoản
      </Button>
    </Form>
  );
}
