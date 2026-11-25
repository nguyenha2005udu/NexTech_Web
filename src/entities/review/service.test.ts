/** @jest-environment node */
import { mockReviewsFor } from "./mock-data";
import { reviewService } from "./service";

describe("reviewService.listByProduct", () => {
  it("mặc định trả tối đa 3 đánh giá của đúng sản phẩm", async () => {
    const reviews = await reviewService.listByProduct("p-1");
    expect(reviews).toHaveLength(3);
    expect(reviews.every((r) => r.productId === "p-1")).toBe(true);
  });

  it("tôn trọng giới hạn truyền vào", async () => {
    expect(await reviewService.listByProduct("p-1", 1)).toHaveLength(1);
  });

  it("giới hạn lớn hơn dữ liệu thì trả hết", async () => {
    expect(await reviewService.listByProduct("p-1", 50)).toHaveLength(mockReviewsFor("p-1").length);
  });
});

describe("mockReviewsFor", () => {
  it("id đánh giá khác nhau giữa các sản phẩm", () => {
    const a = mockReviewsFor("p-a").map((r) => r.id);
    const b = mockReviewsFor("p-b").map((r) => r.id);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
  });

  it("điểm nằm trong 1–5 và ngày là ISO 8601", () => {
    for (const r of mockReviewsFor("p-1")) {
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
      expect(new Date(r.createdAt).toISOString()).toBe(r.createdAt);
    }
  });
});
