// FDD 2.3 — "Xem thêm đánh giá": phân trang ?page=&limit= cho client. Dữ liệu công khai nên không cần phiên.
import { NextResponse } from "next/server";
import { REVIEW_MAX_PAGE_SIZE, REVIEW_PAGE_SIZE } from "@/entities/review";
import { reviewService } from "@/entities/review/service";
import { positiveInt } from "@/lib/pagination";

type Context = { params: Promise<{ productId: string }> };

export async function GET(request: Request, { params }: Context) {
  const { productId } = await params;
  const query = new URL(request.url).searchParams;
  const page = await reviewService.listPage(
    productId,
    positiveInt(query.get("page"), 1),
    positiveInt(query.get("limit"), REVIEW_PAGE_SIZE, REVIEW_MAX_PAGE_SIZE),
  );
  return NextResponse.json(page, { headers: { "Cache-Control": "public, max-age=30" } });
}
