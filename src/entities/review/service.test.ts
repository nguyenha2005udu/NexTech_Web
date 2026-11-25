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

describe("reviewService.listPage", () => {
  it("chia trang đánh giá mẫu, total là tổng của sản phẩm", async () => {
    const total = mockReviewsFor("p-page").length;
    const first = await reviewService.listPage("p-page", 1, 3);
    const second = await reviewService.listPage("p-page", 2, 3);
    expect(first).toMatchObject({ page: 1, total });
    expect(first.items).toHaveLength(3);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it("trang quá giới hạn trả rỗng nhưng vẫn có total", async () => {
    const result = await reviewService.listPage("p-page", 99, 3);
    expect(result.items).toEqual([]);
    expect(result.total).toBeGreaterThan(0);
  });
});

describe("reviewService.create", () => {
  const input = { orderId: "o-1", productId: "p-new", rating: 5, content: "Dùng rất tốt, đáng tiền." };

  it("đánh giá mới lên đầu danh sách, tác giả được ẩn danh", async () => {
    const review = await reviewService.create(input);
    expect(review).toMatchObject({ productId: "p-new", rating: 5, authorLabel: "Người mua đã xác minh" });
    expect(review).not.toHaveProperty("orderId");
    expect((await reviewService.listByProduct("p-new"))[0]?.id).toBe(review.id);
  });

  it("total tăng thêm 1 sau khi viết", async () => {
    const before = (await reviewService.listPage("p-total", 1, 1)).total;
    await reviewService.create({ ...input, productId: "p-total" });
    expect((await reviewService.listPage("p-total", 1, 1)).total).toBe(before + 1);
  });

  it("reviewedProductIds chỉ trả sản phẩm đã đánh giá trong đúng đơn đó", async () => {
    await reviewService.create({ ...input, orderId: "o-ids", productId: "p-a" });
    await reviewService.create({ ...input, orderId: "o-other", productId: "p-b" });
    expect(await reviewService.reviewedProductIds("o-ids")).toEqual(["p-a"]);
    expect(await reviewService.reviewedProductIds("o-none")).toEqual([]);
  });
});
