export interface Review {
  id: string;
  productId: string;
  /** Tên hiển thị; backend ẩn danh hoá thành "Người mua đã xác minh" khi cần */
  authorLabel: string;
  rating: number;
  content: string;
  /** ISO 8601 */
  createdAt: string;
}

/** Một trang đánh giá của sản phẩm, mới nhất trước (`GET /api/products/:id/reviews?page=&limit=`). */
export interface ReviewPage {
  items: Review[];
  page: number;
  /** Tổng số đánh giá của sản phẩm (mọi trang) */
  total: number;
}

/** Dữ liệu người dùng gửi khi viết đánh giá (FDD 5.2.4). Người viết do phiên quyết định, không gửi userId. */
export interface CreateReviewInput {
  orderId: string;
  productId: string;
  rating: number;
  content: string;
}

export const REVIEW_PAGE_SIZE = 3;
export const REVIEW_MAX_PAGE_SIZE = 20;
export const REVIEW_CONTENT_MIN = 10;
export const REVIEW_CONTENT_MAX = 1000;
