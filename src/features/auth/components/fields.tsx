"use client";

import { Input } from "antd";
import type { InputProps } from "antd";
import type { PasswordProps } from "antd/es/input";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "@/components/ui/icons";
import styles from "./auth.module.css";

export function EmailInput(props: InputProps) {
  return (
    <Input
      size="large"
      type="email"
      inputMode="email"
      autoComplete="email"
      placeholder="email@example.com"
      prefix={<MailIcon />}
      {...props}
    />
  );
}

export function PasswordInput(props: PasswordProps) {
  return (
    <Input.Password
      size="large"
      placeholder="Mật khẩu"
      prefix={<LockIcon />}
      iconRender={(visible) => (
        <span aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} role="img">
          {visible ? <EyeIcon /> : <EyeOffIcon />}
        </span>
      )}
      {...props}
    />
  );
}

export function OtpInput(props: InputProps) {
  return (
    <Input
      size="large"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="_ _ _ _ _ _"
      className={styles.otpInput}
      {...props}
    />
  );
}
