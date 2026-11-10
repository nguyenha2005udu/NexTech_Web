import "server-only";
import type { Review } from "./types";

// TODO(backend): thay mock bằng API. Nội dung minh hoạ theo Figma 01.05.
export const reviewService = {
  async listByProduct(productId: string): Promise<Review[]> {
    return [
      {
        id: `${productId}-r1`,
        productId,
        authorLabel: "Người mua đã xác minh",
        content: "Máy chạy mượt khi học và làm việc, bàn phím dễ gõ.",
        rating: 5,
      },
    ];
  },
};
