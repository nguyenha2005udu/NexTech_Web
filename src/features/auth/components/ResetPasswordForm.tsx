"use client";

// FDD 1.1.5 — Đặt mật khẩu mới (Figma 05.07). Bước 3 của ForgotPasswordFlow, sau khi đã xác thực OTP.
// Backend nhận { email, new_password } và chỉ cho đặt trong 10 phút sau khi xác thực OTP.
import { useRouter } from "next/navigation";
import { App, Button, Form } from "antd";
import { routes } from "@/config/routes";
import { resetPassword } from "../actions";
import { useAuthAction } from "../hooks/useAuthAction";
import { NewPasswordFields } from "./NewPasswordFields";
import styles from "./auth.module.css";

export function ResetPasswordForm({ email }: { email: string }) {
  const [form] = Form.useForm<{ password: string; confirmPassword: string }>();
  const { pending, run } = useAuthAction(form);
  const { message } = App.useApp();
  const router = useRouter();

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.form}
      onFinish={(values) =>
        run(resetPassword, { ...values, email }, () => {
          message.success("Đặt lại mật khẩu thành công, vui lòng đăng nhập lại");
          router.push(routes.login);
        })
      }
    >
      <NewPasswordFields label="Mật khẩu mới" placeholder="Nhập mật khẩu mới" />
      <Button type="primary" htmlType="submit" block loading={pending} className={styles.submit}>
        Lưu mật khẩu mới
      </Button>
    </Form>
  );
}
