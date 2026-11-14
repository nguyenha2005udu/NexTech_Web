"use client";

// FDD 1.1.5 — Đặt mật khẩu mới (Figma 05.07). Token đến từ ?token= sau bước OTP.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Form } from "antd";
import { routes } from "@/config/routes";
import { resetPassword } from "../actions";
import { useAuthAction } from "../hooks/useAuthAction";
import { NewPasswordFields } from "./NewPasswordFields";
import styles from "./auth.module.css";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [form] = Form.useForm<{ password: string; confirmPassword: string }>();
  const { pending, run } = useAuthAction(form);

  if (!token) {
    return (
      <div className={styles.form}>
        <p className={styles.notice} role="alert">
          Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </p>
        <Link href={routes.forgotPassword} className={styles.buttonLink}>
          Gửi lại mã xác thực
        </Link>
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.form}
      onFinish={(values) => run(resetPassword, { ...values, token }, () => undefined)}
    >
      <NewPasswordFields label="Mật khẩu mới" placeholder="Nhập mật khẩu mới" />
      <Button type="primary" htmlType="submit" block loading={pending} className={styles.submit}>
        Lưu mật khẩu mới
      </Button>
    </Form>
  );
}
