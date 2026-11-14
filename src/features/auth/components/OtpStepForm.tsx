"use client";

// Bước 2 — nhập mã OTP 6 số (Figma 05.03, 05.06)
import { useEffect, useState } from "react";
import { App, Button, Form } from "antd";
import { zodRule } from "@/lib/zod-rule";
import { requestOtp, verifyOtp } from "../actions";
import { useAuthAction } from "../hooks/useAuthAction";
import { otpSchema, type OtpPurpose } from "../schemas";
import { OtpInput } from "./fields";
import styles from "./auth.module.css";

const RESEND_SECONDS = 60;

type Props = {
  email: string;
  purpose: OtpPurpose;
  onChangeEmail: () => void;
  onVerified: (resetToken?: string) => void;
};

export function OtpStepForm({ email, purpose, onChangeEmail, onVerified }: Props) {
  const [form] = Form.useForm<{ otp: string }>();
  const { pending, run } = useAuthAction(form);
  const { message } = App.useApp();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  function resend() {
    run(requestOtp, { email, purpose }, () => {
      setSecondsLeft(RESEND_SECONDS);
      message.success(`Đã gửi lại mã tới ${email}`);
    });
  }

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.form}
      onFinish={({ otp }) => run(verifyOtp, { email, otp, purpose }, (res) => onVerified(res.data.resetToken))}
    >
      <Form.Item
        name="otp"
        label="Mã xác thực"
        rules={[zodRule(otpSchema)]}
        validateTrigger="onBlur"
        extra={<span className={styles.hint}>Mã có hiệu lực trong 5 phút.</span>}
      >
        <OtpInput autoFocus />
      </Form.Item>
      <div className={styles.inlineLinks}>
        <button type="button" className={styles.linkButton} onClick={onChangeEmail}>
          Đổi email
        </button>
        {secondsLeft > 0 ? (
          <span aria-live="polite">Gửi lại sau {secondsLeft} giây</span>
        ) : (
          <button type="button" className={styles.linkButton} onClick={resend} disabled={pending}>
            Gửi lại mã
          </button>
        )}
      </div>
      <Button type="primary" htmlType="submit" block loading={pending} className={styles.submit}>
        Xác thực mã
      </Button>
    </Form>
  );
}
