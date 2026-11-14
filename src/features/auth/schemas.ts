import { z } from "zod";

// FDD 1.1 — schema dùng chung cho form (client) và Server Action (server).

export const emailSchema = z
  .string({ error: "Vui lòng nhập email" })
  .trim()
  .min(1, "Vui lòng nhập email")
  .pipe(z.email("Email không hợp lệ"));

export const loginPasswordSchema = z.string({ error: "Vui lòng nhập mật khẩu" }).min(1, "Vui lòng nhập mật khẩu");

export const newPasswordSchema = z
  .string({ error: "Vui lòng nhập mật khẩu" })
  .min(8, "Mật khẩu cần ít nhất 8 ký tự")
  .regex(/[A-Za-z]/, "Mật khẩu cần có chữ cái")
  .regex(/\d/, "Mật khẩu cần có chữ số");

export const otpSchema = z
  .string({ error: "Vui lòng nhập mã xác thực" })
  .trim()
  .regex(/^\d{6}$/, "Mã xác thực gồm 6 chữ số");

export const fullNameSchema = z
  .string({ error: "Vui lòng nhập họ và tên" })
  .trim()
  .min(2, "Họ và tên cần ít nhất 2 ký tự")
  .max(80, "Họ và tên tối đa 80 ký tự");

export const otpPurposeSchema = z.enum(["register", "reset-password"]);
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;

export const loginSchema = z.object({ email: emailSchema, password: loginPasswordSchema });
export type LoginInput = z.infer<typeof loginSchema>;

export const requestOtpSchema = z.object({ email: emailSchema, purpose: otpPurposeSchema });
export const verifyOtpSchema = z.object({ email: emailSchema, otp: otpSchema, purpose: otpPurposeSchema });

const passwordsMatch = {
  check: (v: { password: string; confirmPassword: string }) => v.password === v.confirmPassword,
  params: { path: ["confirmPassword"], message: "Mật khẩu nhập lại không khớp" },
};

export const completeRegistrationSchema = z
  .object({ email: emailSchema, fullName: fullNameSchema, password: newPasswordSchema, confirmPassword: z.string() })
  .refine(passwordsMatch.check, passwordsMatch.params);
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Liên kết đặt lại không hợp lệ"),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
