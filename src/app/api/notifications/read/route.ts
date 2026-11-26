// FDD 6.2.2 — Đánh dấu đã đọc. POST (không đổi dữ liệu bằng GET); phiên + quyền + zod như Server Action (mục 10.3).
import { NextResponse } from "next/server";
import { notificationService } from "@/entities/notification/service";
import { markReadSchema } from "@/features/notifications/schemas";
import { can } from "@/lib/permissions";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "notification:read")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Body hỏng không được hiểu thành "đọc tất cả": muốn đọc hết thì gửi `{}` rõ ràng.
  const body: unknown = await request.json().catch(() => null);
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });

  await notificationService.markRead(parsed.data.ids);
  return NextResponse.json({ ok: true });
}
