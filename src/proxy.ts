// Mục 10.3 lớp 1 — kiểm tra nhẹ trước khi vào trang. Lớp quyết định vẫn là page (requirePermission),
// gateway và service backend.
//
// Ngoài ra proxy làm mới phiên: access token (15 phút) hết hạn thì trình duyệt tự xoá cookie, chỉ còn
// refresh token. Server Component không ghi được cookie, nên nếu để gateway refresh trong lúc render thì
// refresh token mới (backend xoay vòng mỗi lần) bị mất. Vì vậy proxy gọi GET /api/auth/me trước để
// gateway refresh hộ (gộp các request đồng thời), rồi ghi cookie mới lên cả request lẫn response.
import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/config/routes";
import { type ParsedCookie, sessionCookiesFrom } from "@/lib/api/set-cookie";

const PROTECTED = ["/account", "/checkout", "/admin", "/assistant/"]; // `/assistant` gốc công khai cho khách
const AUTH_PAGES: string[] = [routes.login, routes.register, routes.forgotPassword];

type Session = { loggedIn: boolean; role?: string; cookies: ParsedCookie[] };

/** Đọc `role` trong access token mà không kiểm chữ ký — chỉ để điều hướng, không dùng để cấp quyền. */
function roleOf(accessToken: string | undefined): string | undefined {
  const payload = accessToken?.split(".")[1];
  if (!payload) return undefined;
  try {
    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data === "object" && data !== null && "role" in data && typeof data.role === "string"
      ? data.role
      : undefined;
  } catch {
    return undefined;
  }
}

async function readSession(req: NextRequest): Promise<Session> {
  const access = req.cookies.get("access_token")?.value;
  const refresh = req.cookies.get("refresh_token")?.value;
  if (access) return { loggedIn: true, role: roleOf(access), cookies: [] };
  if (!refresh || !process.env.API_BASE_URL) return { loggedIn: false, cookies: [] };

  try {
    const res = await fetch(new URL("/api/auth/me", process.env.API_BASE_URL), {
      headers: { Cookie: `refresh_token=${refresh}`, Accept: "application/json" },
      cache: "no-store",
    });
    const cookies = sessionCookiesFrom(res.headers);
    if (res.ok) {
      const newAccess = cookies.find((c) => c.name === "access_token")?.value;
      return { loggedIn: true, role: roleOf(newAccess), cookies };
    }
    // 401/403: gateway đã trả Set-Cookie xoá phiên. 5xx: giữ cookie, không coi nhầm là khách.
    return { loggedIn: res.status >= 500, cookies };
  } catch {
    return { loggedIn: true, cookies: [] };
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await readSession(req);

  let res: NextResponse;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`)) && !session.loggedIn) {
    const url = new URL(routes.login, req.url);
    url.searchParams.set("callbackUrl", pathname + search);
    res = NextResponse.redirect(url);
  } else if (pathname.startsWith("/admin") && session.role !== undefined && session.role !== "admin") {
    res = NextResponse.redirect(new URL(routes.forbidden, req.url));
  } else if (AUTH_PAGES.includes(pathname) && session.loggedIn) {
    res = NextResponse.redirect(new URL(routes.home, req.url));
  } else {
    // Cookie mới cũng phải có trong request để Server Component của lần render này đọc được
    for (const c of session.cookies) {
      if (c.value) req.cookies.set(c.name, c.value);
      else req.cookies.delete(c.name);
    }
    res = NextResponse.next({ request: { headers: req.headers } });
  }

  for (const c of session.cookies) res.cookies.set(c.name, c.value, c.options);
  return res;
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
    "/assistant/:path+",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
