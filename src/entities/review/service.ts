import "server-only";
import { z } from "zod";
import { apiFetch, apiFetchPublic } from "@/lib/api/http";
import type { CreateReviewInput, Review, ReviewPage } from "./types";

// FDD 2.3 (xem) + 5.2.4 (viết) — Đánh giá sản phẩm, gọi catalog-service qua gateway (NT.CATALOG §1).
// Xem là công khai (cache như trang sản phẩm ISR). Viết cần đăng nhập: backend tự kiểm người dùng đã mua
// (đơn `paid`/`shipped`, BR-11) và mỗi người chỉ đánh giá một sản phẩm một lần.

interface RawReview {
  id: string;
  user_name?: string | null;
  rating: string | number;
  title: string | null;
  content: string | null;
  created_at: string;
}

const REVALIDATE = 60;
const ANONYMOUS = "Ẩn danh";

const toReview = (productId: string, raw: RawReview): Review => ({
  id: raw.id,
  productId,
  authorLabel: raw.user_name || ANONYMOUS,
  rating: Number(raw.rating),
  content: raw.content ?? raw.title ?? "",
  createdAt: raw.created_at,
});

export const reviewService = {
  /** Một trang đánh giá (`page` bắt đầu từ 1), mới nhất trước, kèm tổng số. */
  async listPage(productId: string, page: number, pageSize: number): Promise<ReviewPage> {
    // Id rác không thể có đánh giá; backend sẽ báo lỗi CSDL (500) nếu gửi lên.
    if (!z.uuid().safeParse(productId).success) return { items: [], page, total: 0 };
    const res = await apiFetchPublic<{ items: RawReview[]; total: number; page: number }>(
      `/api/products/${productId}/reviews?page=${page}&limit=${pageSize}`,
      REVALIDATE,
    );
    return { items: res.items.map((r) => toReview(productId, r)), page: res.page, total: res.total };
  },

  /** Viết đánh giá. Chưa mua (403 NT-CAT-1006) hoặc đã đánh giá (403 NT-CAT-1007) → ApiError. */
  async create(input: CreateReviewInput): Promise<Review> {
    const raw = await apiFetch<RawReview>(`/api/products/${encodeURIComponent(input.productId)}/reviews`, {
      method: "POST",
      body: { rating: input.rating, content: input.content },
    });
    return toReview(input.productId, raw);
  },
};
