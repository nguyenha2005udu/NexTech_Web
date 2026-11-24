"use client";

// FDD 4.1 → 4.2 — Trang giỏ (CSR) cần biết khách hay người dùng để báo "cần đăng nhập để đặt hàng"
// (Figma 03.03). Hỏi Route Handler /api/session sau khi mount, giống UserMenu ở header: trang vẫn tĩnh.
import { useEffect, useState } from "react";

/** Route Handler trả `{ user: {...} | null }` — xem app/api/session/route.ts */
const SESSION_ENDPOINT = "/api/session";

/** `null` khi chưa biết (đang hỏi hoặc lỗi mạng), `true`/`false` khi đã có câu trả lời. */
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(SESSION_ENDPOINT, { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json() as Promise<{ user: unknown }>)
      .then((data) => setSignedIn(data.user != null))
      .catch(() => {
        // Huỷ khi rời trang hoặc lỗi mạng: giữ "chưa biết", proxy vẫn chặn /checkout nếu là khách.
      });
    return () => controller.abort();
  }, []);

  return signedIn;
}
