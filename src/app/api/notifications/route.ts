// FDD 6.2 — Danh sách thông báo + số chưa đọc cho chuông ở header (RTK Query gọi, polling 30s).
// Route Handler dùng service ở server nên cookie phiên không lộ ra JS (mục 10.1). Khách → 401.
import { NextResponse } from "next/server";
import { notificationService } from "@/entities/notification/service";
import { can } from "@/lib/permissions";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !can(user.role, "notification:read")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await notificationService.list(), { headers: { "Cache-Control": "no-store" } });
}
