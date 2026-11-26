import "server-only";
import { randomUUID } from "node:crypto";
import { mockReviewsFor } from "./mock-data";
import type { CreateReviewInput, Review, ReviewPage } from "./types";

// FDD 2.3 (xem) + 5.2.4 (viết). TODO(backend): thay mock bằng lib/api/http.ts khi chốt hợp đồng:
//   listPage → apiFetch<ReviewPage>(`/api/products/${id}/reviews?page=&limit=`)   (công khai)
//   create   → apiFetch("/api/reviews", { method: "POST", body })   (backend kiểm đơn của người dùng + chưa đánh giá)
// Đánh giá mới giữ trong bộ nhớ server (globalThis: Route Handler và Server Action được bundle riêng).
type StoredReview = Review & { orderId: string };
const globalStore = globalThis as typeof globalThis & { __nextechReviews?: StoredReview[] };
const created: StoredReview[] = (globalStore.__nextechReviews ??= []);

/** Mới nhất trước: đánh giá vừa viết lên đầu, rồi tới dữ liệu mẫu. */
function allFor(productId: string): Review[] {
  const mine = created.filter((r) => r.productId === productId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...mine, ...mockReviewsFor(productId)];
}

export const reviewService = {
  /** Đánh giá mới nhất của sản phẩm. */
  async listByProduct(productId: string, limit = 3): Promise<Review[]> {
    return allFor(productId).slice(0, limit);
  },

  /** Một trang đánh giá (`page` bắt đầu từ 1), kèm tổng số. */
  async listPage(productId: string, page: number, pageSize: number): Promise<ReviewPage> {
    const all = allFor(productId);
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), page, total: all.length };
  },

  /** Sản phẩm nào trong đơn này đã được đánh giá (để ẩn nút "Viết đánh giá"). */
  async reviewedProductIds(orderId: string): Promise<string[]> {
    return created.filter((r) => r.orderId === orderId).map((r) => r.productId);
  },

  async create(input: CreateReviewInput): Promise<Review> {
    const review: StoredReview = {
      id: randomUUID(),
      orderId: input.orderId,
      productId: input.productId,
      authorLabel: "Người mua đã xác minh",
      rating: input.rating,
      content: input.content,
      createdAt: new Date().toISOString(),
    };
    created.push(review);
    return { id: review.id, productId: review.productId, authorLabel: review.authorLabel, rating: review.rating, content: review.content, createdAt: review.createdAt };
  },
};
