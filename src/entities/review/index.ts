// Chỉ export type + hằng (dùng được ở client). Service ở server: "@/entities/review/service".
export type { CreateReviewInput, Review, ReviewPage } from "./types";
export { REVIEW_CONTENT_MAX, REVIEW_CONTENT_MIN, REVIEW_MAX_PAGE_SIZE, REVIEW_PAGE_SIZE } from "./types";
