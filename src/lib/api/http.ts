import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIES, sessionCookiesFrom } from "./set-cookie";

// Gọi backend qua API Gateway từ phía server (Server Component, Server Action, Route Handler).
// - Gửi kèm cookie phiên của trình duyệt (`access_token`, `refresh_token`).
// - Gateway có thể làm mới token và trả Set-Cookie: ghi lại lên domain web. Chỉ ghi được trong
//   Server Action / Route Handler; ở Server Component thì bỏ qua (proxy.ts đã làm mới trước).
// - Body thành công không bọc `{ data }` (ADR-0009 của backend). Body lỗi xem `ApiErrorBody`.

/** Body lỗi chuẩn của backend (api-convention §5). `message` là mảng khi lỗi validate. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  code?: string;
  error?: string;
  request_id?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

function isErrorBody(body: unknown): body is ApiErrorBody {
  return typeof body === "object" && body !== null && "message" in body;
}

export function apiBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) throw new Error("Thiếu biến môi trường API_BASE_URL");
  return url;
}

export async function apiFetch<T>(path: string, init: { method?: Method; body?: unknown } = {}): Promise<T> {
  const store = await cookies();
  const cookieHeader = SESSION_COOKIES.flatMap((name) => {
    const value = store.get(name)?.value;
    return value ? [`${name}=${value}`] : [];
  }).join("; ");

  let res: Response;
  try {
    res = await fetch(new URL(path, apiBaseUrl()), {
      method: init.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(init.body !== undefined && { "Content-Type": "application/json" }),
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "Không kết nối được máy chủ, vui lòng thử lại sau");
  }

  for (const c of sessionCookiesFrom(res.headers)) {
    try {
      store.set(c.name, c.value, c.options);
    } catch {
      // Server Component không được ghi cookie — bỏ qua
    }
  }

  const body: unknown = await res.json().catch(() => undefined);
  if (!res.ok) {
    if (isErrorBody(body)) {
      const message = Array.isArray(body.message) ? (body.message[0] ?? "Dữ liệu không hợp lệ") : body.message;
      throw new ApiError(res.status, message, body.code);
    }
    throw new ApiError(res.status, "Máy chủ gặp lỗi, vui lòng thử lại sau");
  }
  return body as T;
}
