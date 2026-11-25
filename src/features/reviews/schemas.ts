import { z } from "zod";
import { REVIEW_CONTENT_MAX, REVIEW_CONTENT_MIN } from "@/entities/review";

export const createReviewSchema = z.object({
  orderId: z.string().min(1).max(64),
  productId: z.string().min(1).max(64),
  rating: z
    .number({ message: "Chọn số sao" })
    .int("Chọn số sao")
    .min(1, "Chọn số sao")
    .max(5, "Chọn số sao"),
  content: z
    .string({ message: "Nhập nội dung đánh giá" })
    .trim()
    .min(REVIEW_CONTENT_MIN, `Nội dung tối thiểu ${REVIEW_CONTENT_MIN} ký tự`)
    .max(REVIEW_CONTENT_MAX, `Nội dung tối đa ${REVIEW_CONTENT_MAX} ký tự`),
});
