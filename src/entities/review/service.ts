import "server-only";
import { mockReviewsFor } from "./mock-data";
import type { Review } from "./types";

// TODO(backend): thay mock bằng lib/api/http.ts khi chốt hợp đồng API (giả định kỹ thuật #1).
export const reviewService = {
  /** Đánh giá mới nhất của sản phẩm (FDD 2.3). */
  async listByProduct(productId: string, limit = 3): Promise<Review[]> {
    return mockReviewsFor(productId).slice(0, limit);
  },
};
