// FDD 2.3 — RTK Query cho "Xem thêm đánh giá" (dữ liệu server cần tải thêm phía client, mục 7.1).
import type { ReviewPage } from "@/entities/review";
import { baseApi } from "@/lib/api/baseApi";

export interface ProductReviewsQuery {
  productId: string;
  page: number;
  limit?: number;
}

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProductReviews: build.query<ReviewPage, ProductReviewsQuery>({
      query: ({ productId, page, limit }) => ({
        url: `/products/${encodeURIComponent(productId)}/reviews`,
        params: { page, ...(limit && { limit }) },
      }),
    }),
  }),
});

export const { useLazyGetProductReviewsQuery } = reviewsApi;
