import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api/http";

// Phiên đăng nhập do backend giữ bằng cookie httpOnly. Web hỏi lại `GET /api/auth/me` để biết
// người đang đăng nhập và vai trò. Tài khoản bị khoá đã bị backend chặn ở login và refresh.
const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  role: z.enum(["user", "admin"]),
  avatar_url: z.string().nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

/** Người đang đăng nhập, `null` nếu là khách. Gọi nhiều lần trong 1 request chỉ tốn 1 lần gọi API. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  if (!store.has("access_token") && !store.has("refresh_token")) return null;
  try {
    return sessionUserSchema.parse(await apiFetch<unknown>("/api/auth/me"));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
    throw err;
  }
});
