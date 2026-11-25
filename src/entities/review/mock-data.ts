import type { Review } from "./types";

// Nội dung minh hoạ theo Figma 01.05. Thay bằng API backend khi có hợp đồng.
const SAMPLES: ReadonlyArray<Pick<Review, "rating" | "content">> = [
  { rating: 5, content: "Máy chạy mượt khi học và làm việc, bàn phím dễ gõ." },
  { rating: 4, content: "Giao hàng nhanh, đóng gói cẩn thận. Pin dùng được khoảng 6 tiếng." },
  { rating: 5, content: "Đúng mô tả, tư vấn nhiệt tình." },
  { rating: 4, content: "Màn hình đẹp, loa hơi nhỏ nhưng đủ dùng cho học online." },
  { rating: 3, content: "Máy ổn trong tầm giá, quạt hơi ồn khi chạy nặng." },
  { rating: 5, content: "Mua cho con đi học, dùng được cả ngày không lo hết pin." },
  { rating: 4, content: "Đóng gói kỹ, có tặng kèm chuột. Sẽ ủng hộ lần sau." },
];

export function mockReviewsFor(productId: string): Review[] {
  return SAMPLES.map((s, i) => ({
    id: `${productId}-r${i + 1}`,
    productId,
    authorLabel: "Người mua đã xác minh",
    rating: s.rating,
    content: s.content,
    createdAt: `2026-11-0${i + 1}T09:00:00.000Z`,
  }));
}
