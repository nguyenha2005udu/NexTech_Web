// FDD 1.1.1 — Đăng ký bằng email: 3 bước (Figma 05.02–05.04). SSG.
import type { Metadata } from "next";
import { RegisterFlow } from "@/features/auth";

export const metadata: Metadata = { title: "Tạo tài khoản" };

export default function Page() {
  return <RegisterFlow />;
}
