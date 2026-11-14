"use client";

// Bước 1 — nhập email để nhận mã OTP (Figma 05.02, 05.05)
import { Button, Form } from "antd";
import { zodRule } from "@/lib/zod-rule";
import { requestOtp } from "../actions";
import { useAuthAction } from "../hooks/useAuthAction";
import { emailSchema, type OtpPurpose } from "../schemas";
import { EmailInput } from "./fields";
import styles from "./auth.module.css";

type Props = {
  purpose: OtpPurpose;
  defaultEmail?: string;
  onSent: (email: string) => void;
};

export function EmailStepForm({ purpose, defaultEmail, onSent }: Props) {
  const [form] = Form.useForm<{ email: string }>();
  const { pending, run } = useAuthAction(form);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.form}
      initialValues={{ email: defaultEmail }}
      onFinish={({ email }) => run(requestOtp, { email, purpose }, () => onSent(email.trim()))}
    >
      <Form.Item name="email" label="Email" rules={[zodRule(emailSchema)]} validateTrigger="onBlur">
        <EmailInput autoFocus />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={pending} className={styles.submit}>
        Gửi mã xác thực
      </Button>
    </Form>
  );
}
