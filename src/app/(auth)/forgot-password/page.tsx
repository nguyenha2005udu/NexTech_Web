// FDD 1.1.5 — Quên mật khẩu: email → OTP (Figma 05.05–05.06). SSG.
import type { Metadata } from "next";
import { ForgotPasswordFlow } from "@/features/auth";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return <ForgotPasswordFlow />;
}
