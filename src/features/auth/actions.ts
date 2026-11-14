"use server";

// FDD 1.1 — Server Action cho đăng nhập / đăng ký / đặt lại mật khẩu.
// TODO(backend): chưa có Auth.js và API backend. Các action dưới đây chỉ validate bằng zod rồi
// trả kết quả mock để chạy được luồng giao diện. Khi nối backend: gọi API qua lib/api/http.ts
// và dùng signIn() của Auth.js cho đăng nhập.
import type { z } from "zod";
import type { ActionFailure, ActionResult } from "@/types/action";
import {
  completeRegistrationSchema,
  loginSchema,
  requestOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "./schemas";

const NOT_CONNECTED: ActionFailure = {
  ok: false,
  message: "Chưa kết nối máy chủ xác thực. Đây là bản giao diện.",
};

function invalid(error: z.ZodError): ActionFailure {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, message: error.issues[0]?.message ?? "Dữ liệu không hợp lệ", fieldErrors };
}

/** 1.1.2 Đăng nhập bằng email + mật khẩu */
export async function loginWithEmail(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return NOT_CONNECTED;
}

/** 1.1.1 / 1.1.5 Gửi mã OTP tới email */
export async function requestOtp(input: unknown): Promise<ActionResult> {
  const parsed = requestOtpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return { ok: true }; // mock: coi như đã gửi mã
}

/** Xác thực mã OTP. Với luồng đặt lại mật khẩu, trả về token dùng ở /reset-password. */
export async function verifyOtp(input: unknown): Promise<ActionResult<{ resetToken?: string }>> {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  // mock: chấp nhận mọi mã 6 số
  return { ok: true, data: parsed.data.purpose === "reset-password" ? { resetToken: "demo-token" } : {} };
}

/** 1.1.1 Hoàn tất đăng ký (họ tên + mật khẩu) */
export async function completeRegistration(input: unknown): Promise<ActionResult> {
  const parsed = completeRegistrationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return NOT_CONNECTED;
}

/** 1.1.5 Đặt mật khẩu mới */
export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return NOT_CONNECTED;
}
