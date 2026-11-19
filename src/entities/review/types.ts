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
