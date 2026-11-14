"use client";

import { Form } from "antd";
import { zodRule } from "@/lib/zod-rule";
import { newPasswordSchema } from "../schemas";
import { PasswordInput } from "./fields";
import styles from "./auth.module.css";

/** Mật khẩu + nhập lại + gợi ý (Figma 05.04, 05.07) */
export function NewPasswordFields({ label = "Mật khẩu", placeholder = "Mật khẩu" }: { label?: string; placeholder?: string }) {
  return (
    <>
      <Form.Item name="password" label={label} rules={[zodRule(newPasswordSchema)]} validateTrigger="onBlur">
        <PasswordInput placeholder={placeholder} autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Nhập lại mật khẩu"
        dependencies={["password"]}
        validateTrigger="onBlur"
        rules={[
          { required: true, message: "Vui lòng nhập lại mật khẩu" },
          ({ getFieldValue }) => ({
            validator: async (_r, value: unknown) => {
              if (value && value !== getFieldValue("password")) throw new Error("Mật khẩu nhập lại không khớp");
            },
          }),
        ]}
      >
        <PasswordInput placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
      </Form.Item>
      <p className={styles.hint}>Dùng mật khẩu mạnh và khác với mật khẩu ở các trang khác.</p>
    </>
  );
}
