// Đọc header Set-Cookie do gateway trả về để ghi lại cookie phiên lên domain của web.
// Backend ghi 2 cookie httpOnly `access_token`, `refresh_token` (NT.IDENTITY auth.cookies.ts).

export const SESSION_COOKIES = ["access_token", "refresh_token"] as const;

export interface ParsedCookie {
  name: string;
  value: string;
  options: {
    path?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
  };
}

export function parseSetCookie(raw: string): ParsedCookie | null {
  const [pair, ...attrs] = raw.split(";");
  const eq = pair?.indexOf("=") ?? -1;
  if (!pair || eq <= 0) return null;

  const cookie: ParsedCookie = {
    name: pair.slice(0, eq).trim(),
    value: decodeURIComponent(pair.slice(eq + 1).trim()),
    options: {},
  };
  for (const attr of attrs) {
    const [k = "", v = ""] = attr.split("=").map((s) => s.trim());
    switch (k.toLowerCase()) {
      case "path":
        cookie.options.path = v;
        break;
      case "max-age":
        cookie.options.maxAge = Number(v);
        break;
      case "expires":
        cookie.options.expires = new Date(v);
        break;
      case "httponly":
        cookie.options.httpOnly = true;
        break;
      case "secure":
        cookie.options.secure = true;
        break;
      case "samesite": {
        const s = v.toLowerCase();
        if (s === "lax" || s === "strict" || s === "none") cookie.options.sameSite = s;
        break;
      }
    }
  }
  return cookie;
}

/** Chỉ nhận 2 cookie phiên, bỏ qua cookie khác nếu có. */
export function sessionCookiesFrom(headers: Headers): ParsedCookie[] {
  return headers
    .getSetCookie()
    .map(parseSetCookie)
    .filter((c): c is ParsedCookie => c !== null && (SESSION_COOKIES as readonly string[]).includes(c.name));
}
