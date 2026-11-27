import { canReview } from "./review.rules";

describe("canReview", () => {
  it.each(["paid", "shipped"] as const)("đơn %s thì được đánh giá", (status) => {
    expect(canReview({ status })).toBe(true);
  });

  it.each(["pending", "processing", "cancelled", "failed"] as const)("đơn %s thì chưa được đánh giá", (status) => {
    expect(canReview({ status })).toBe(false);
  });
});
