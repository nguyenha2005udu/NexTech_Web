/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/lib/api/http", () => ({ apiFetch: jest.fn(), apiFetchPublic: jest.fn() }));

import { apiFetch, apiFetchPublic } from "@/lib/api/http";
import { reviewService } from "./service";

const fetchMock = jest.mocked(apiFetch);
const publicMock = jest.mocked(apiFetchPublic);
const PRODUCT = "6f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f";

const raw = (over: Record<string, unknown> = {}) => ({
  id: "r-1",
  user_name: "Nguyễn An",
  avatar_url: null,
  rating: "4.0",
  title: null,
  content: "Máy chạy mượt.",
  created_at: "2026-11-01T09:00:00.000Z",
  ...over,
});

afterEach(() => jest.resetAllMocks());

describe("reviewService.listPage", () => {
  it("gọi API công khai theo trang, có cache, đổi điểm về số", async () => {
    publicMock.mockResolvedValue({ items: [raw()], total: 7, page: 2, limit: 3, totalPages: 3 });
    const page = await reviewService.listPage(PRODUCT, 2, 3);
    expect(publicMock).toHaveBeenCalledWith(`/api/products/${PRODUCT}/reviews?page=2&limit=3`, 60);
    expect(page).toEqual({
      items: [{ id: "r-1", productId: PRODUCT, authorLabel: "Nguyễn An", rating: 4, content: "Máy chạy mượt.", createdAt: "2026-11-01T09:00:00.000Z" }],
      page: 2,
      total: 7,
    });
  });

  it("không có tên thì 'Ẩn danh'; không có nội dung thì dùng tiêu đề", async () => {
    publicMock.mockResolvedValue({ items: [raw({ user_name: null, content: null, title: "Tốt" })], total: 1, page: 1 });
    const { items } = await reviewService.listPage(PRODUCT, 1, 3);
    expect(items[0]).toMatchObject({ authorLabel: "Ẩn danh", content: "Tốt" });
  });

  it("id sản phẩm không phải UUID thì trả rỗng, không gọi backend", async () => {
    expect(await reviewService.listPage("asus-vivobook-15", 1, 3)).toEqual({ items: [], page: 1, total: 0 });
    expect(publicMock).not.toHaveBeenCalled();
  });
});

describe("reviewService.create", () => {
  it("gửi số sao + nội dung tới đúng sản phẩm, không gửi userId/orderId", async () => {
    fetchMock.mockResolvedValue(raw({ id: "r-9", rating: "5", user_name: "Bình" }));
    const review = await reviewService.create({ productId: PRODUCT, rating: 5, content: "Rất tốt, đáng tiền." });
    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${PRODUCT}/reviews`, {
      method: "POST",
      body: { rating: 5, content: "Rất tốt, đáng tiền." },
    });
    expect(review).toMatchObject({ id: "r-9", rating: 5, authorLabel: "Bình" });
  });
});
