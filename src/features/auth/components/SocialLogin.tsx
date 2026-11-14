"use client";

// FDD 1.1.3–1.1.4 — Đăng nhập Google / Facebook.
// TODO(auth): nối signIn("google" | "facebook") của Auth.js khi cấu hình provider.
import { App, Button } from "antd";
import { FacebookIcon, GoogleIcon } from "@/components/ui/icons";
import styles from "./auth.module.css";

const PROVIDERS = [
  { id: "google", label: "Tiếp tục với Google", Icon: GoogleIcon },
  { id: "facebook", label: "Tiếp tục với Facebook", Icon: FacebookIcon },
] as const;

export function SocialLogin() {
  const { message } = App.useApp();
  return (
    <div className={styles.social}>
      <div className={styles.divider}>hoặc</div>
      {PROVIDERS.map(({ id, label, Icon }) => (
        <Button
          key={id}
          block
          className={styles.socialButton}
          icon={<Icon />}
          onClick={() => message.info("Chưa cấu hình đăng nhập mạng xã hội. Đây là bản giao diện.")}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
