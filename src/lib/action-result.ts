import "server-only";
import type { z } from "zod";
import { ApiError } from "@/lib/api/http";
import type { ActionFailure } from "@/types/action";

// Chuyển lỗi thành ActionFailure cho Server Action (mục 10.3). Dùng chung mọi feature (design/admin Q-05).

/** Lỗi zod → thông báo chung + lỗi theo từng ô form (`path` nối bằng dấu chấm). */
export function invalid(error: z.ZodError): ActionFailure {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, message: error.issues[0]?.message ?? "Dữ liệu không hợp lệ", fieldErrors };
}

/**
 * Lỗi backend (ApiError) → ActionFailure. `fieldByCode` gắn mã lỗi backend vào một ô của form,
 * ví dụ `{ "NT-PRM-1011": "code" }`. Lỗi không phải ApiError được ném tiếp (lỗi lập trình).
 */
export function failed(err: unknown, fieldByCode: Readonly<Record<string, string>> = {}): ActionFailure {
  if (!(err instanceof ApiError)) throw err;
  const field = err.code ? fieldByCode[err.code] : undefined;
  return { ok: false, message: err.message, ...(field && { fieldErrors: { [field]: err.message } }) };
}
