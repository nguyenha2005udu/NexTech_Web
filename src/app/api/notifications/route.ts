// FDD 6.2 — Danh sách thông báo (phân trang ?page=&limit=) + số chưa đọc cho chuông ở header (RTK Query gọi, polling 30s).
// Route Handler dùng service ở server nên cookie phiên không lộ ra JS (mục 10.1). Khách → 401.
import { NextResponse } from "next/server";
import { notificationService } from "@/entities/notification/service";
import { parsePage, parsePageSize } from "@/entities/notification";
import { can } from "@/lib/permissions";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "notification:read")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const list = await notificationService.list(parsePage(params.get("page")), parsePageSize(params.get("limit")));
  return NextResponse.json(list, { headers: { "Cache-Control": "no-store" } });
}
