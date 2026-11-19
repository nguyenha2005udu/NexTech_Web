"use server";

// FDD 1.1 — Server Action cho đăng nhập / đăng ký / đặt lại mật khẩu / đăng xuất.
// Gọi identity-service qua API Gateway (lib/api/http.ts). Phiên là cookie httpOnly do backend cấp,
// apiFetch ghi lại cookie lên domain web. Hợp đồng: Backend_NexTech NT.IDENTITY API_Spec §1.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { failed, invalid } from "@/lib/action-result";
import { apiFetch } from "@/lib/api/http";
import type { ActionResult } from "@/types/action";
import {
  completeRegistrationSchema,
  loginSchema,
  requestOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "./schemas";

// Mã lỗi backend gắn được vào một ô của form
const FIELD_BY_CODE: Record<string, string> = {
  "NT-IDN-1006": "email", // Email đã được sử dụng
  "NT-IDN-1007": "otp", // OTP sai, hết hạn hoặc vượt số lần thử
};

async function call(path: string, body: unknown): Promise<ActionResult> {
  try {
    await apiFetch(path, { method: "POST", body });
    return { ok: true };
  } catch (err) {
    return failed(err, FIELD_BY_CODE);
  }
}

/** 1.1.2 Đăng nhập bằng email + mật khẩu. Backend ghi cookie phiên. */
export async function loginWithEmail(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return call("/api/auth/login", parsed.data);
}

/** 1.1.1 / 1.1.5 Gửi mã OTP tới email. Đăng ký và quên mật khẩu dùng 2 API khác nhau. */
export async function requestOtp(input: unknown): Promise<ActionResult> {
  const parsed = requestOtpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email, purpose } = parsed.data;
  return call(purpose === "register" ? "/api/auth/send-otp" : "/api/auth/forgot-password", { email });
}

/** Xác thực mã OTP. Backend đánh dấu email đã xác thực trong 10 phút cho bước kế tiếp. */
export async function verifyOtp(input: unknown): Promise<ActionResult> {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email, otp, purpose } = parsed.data;
  return call(purpose === "register" ? "/api/auth/verify-otp" : "/api/auth/verify-reset-otp", { email, otp });
}

/** 1.1.1 Hoàn tất đăng ký (họ tên + mật khẩu). Backend không tự đăng nhập sau khi đăng ký. */
export async function completeRegistration(input: unknown): Promise<ActionResult> {
  const parsed = completeRegistrationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email, fullName, password } = parsed.data;
  return call("/api/auth/register", { email, password, full_name: fullName });
}

/** 1.1.5 Đặt mật khẩu mới, sau khi đã xác thực OTP. Backend thu hồi mọi phiên của tài khoản. */
export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email, password } = parsed.data;
  return call("/api/auth/reset-password", { email, new_password: password });
}

/** 1.1.6 Đăng xuất. Backend thu hồi refresh token và xoá cookie. */
export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Backend lỗi vẫn cho đăng xuất ở web: cookie phiên bị xoá bên dưới
  }
  const store = await cookies();
  store.delete("access_token");
  store.delete("refresh_token");
  redirect(routes.home);
}
