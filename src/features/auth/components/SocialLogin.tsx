"use client";

// FDD 1.1.3–1.1.4 — Đăng nhập Google / Facebook.
// Backend tự chạy OAuth: GET /api/auth/{google|facebook} → nhà cung cấp → callback → ghi cookie phiên
// → chuyển về REDIRECT_URI. Web chỉ cần đưa trình duyệt tới đó; next.config.ts rewrite đường dẫn
// này sang API Gateway nên không lộ địa chỉ backend ra client.
import { Button } from "antd";
import { FacebookIcon, GoogleIcon } from "@/components/ui/icons";
import styles from "./auth.module.css";

const PROVIDERS = [
  { id: "google", label: "Tiếp tục với Google", Icon: GoogleIcon },
  { id: "facebook", label: "Tiếp tục với Facebook", Icon: FacebookIcon },
] as const;

export function SocialLogin() {
  return (
    <div className={styles.social}>
      <div className={styles.divider}>hoặc</div>
      {PROVIDERS.map(({ id, label, Icon }) => (
        <Button key={id} block href={`/api/auth/${id}`} className={styles.socialButton} icon={<Icon />}>
          {label}
        </Button>
      ))}
    </div>
  );
}
