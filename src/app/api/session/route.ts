// FDD 1.1 — Cho header (Client Component) biết ai đang đăng nhập.
// Header nằm trong layout công khai; nếu đọc phiên ngay khi render ở server thì trang chủ, danh mục,
// chi tiết SP mất SSG/ISR (mục 10.1). Vì vậy header hỏi route này sau khi trang đã tải.
// Route Handler ghi được cookie, nên nếu gateway làm mới phiên thì cookie mới vẫn được lưu.
import { NextResponse } from "next/server";
import type { SessionResponse } from "@/components/layout/UserMenu";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  let body: SessionResponse = { user: null };
  try {
    const user = await getSessionUser();
    if (user) body = { user: { full_name: user.full_name, role: user.role } };
  } catch {
    // Backend lỗi: header hiện như khách, không làm hỏng trang
  }
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
