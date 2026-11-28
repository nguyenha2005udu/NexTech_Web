// Mã lỗi của catalog-service khi viết đánh giá (NT.CATALOG API_Spec §3). Không có "use server" để import được ở client.

export const REVIEW_ERROR = {
  /** Chưa mua sản phẩm này (không có đơn `paid`/`shipped` chứa nó) — 403 */
  NOT_PURCHASED: "NT-CAT-1006",
  /** Mỗi người chỉ đánh giá một lần mỗi sản phẩm — 403 */
  ALREADY_REVIEWED: "NT-CAT-1007",
} as const;

/** Tên "ô" trong `fieldErrors` báo hiệu đã đánh giá rồi (client dùng để đổi nút, không hiện như lỗi ô nhập). */
export const ALREADY_REVIEWED_FIELD = "alreadyReviewed";
