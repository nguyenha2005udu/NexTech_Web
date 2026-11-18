"use client";

// FDD 1.1.2 — Đăng nhập bằng email (Figma 05.01)
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Form } from "antd";
import { routes } from "@/config/routes";
import { zodRule } from "@/lib/zod-rule";
import { loginWithEmail } from "../actions";
import { useAuthAction } from "../hooks/useAuthAction";
import { emailSchema, loginPasswordSchema, type LoginInput } from "../schemas";
import { EmailInput, PasswordInput } from "./fields";
import styles from "./auth.module.css";

/** Chỉ quay lại đường dẫn nội bộ, chặn open redirect (`//evil.com`, `https://...`). */
function safeCallback(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : routes.home;
}

export function LoginForm() {
  const [form] = Form.useForm<LoginInput>();
  const { pending, run } = useAuthAction(form);
  const router = useRouter();
  const callbackUrl = safeCallback(useSearchParams().get("callbackUrl"));

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.form}
      onFinish={(values) => run(loginWithEmail, values, () => {
          router.replace(callbackUrl);
          router.refresh();
        })}
    >
      <Form.Item name="email" label="Email" rules={[zodRule(emailSchema)]} validateTrigger="onBlur">
        <EmailInput autoFocus />
      </Form.Item>
      <Form.Item name="password" label="Mật khẩu" rules={[zodRule(loginPasswordSchema)]} validateTrigger="onBlur">
        <PasswordInput autoComplete="current-password" />
      </Form.Item>
      <Link href={routes.forgotPassword} className={`${styles.link} ${styles.forgot}`}>
        Quên mật khẩu?
      </Link>
      <Button type="primary" htmlType="submit" block loading={pending} className={styles.submit}>
        Đăng nhập
      </Button>
    </Form>
  );
}
