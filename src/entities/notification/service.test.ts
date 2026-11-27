/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/lib/api/http", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
      readonly code?: string,
    ) {
      super(message);
    }
  }
  return { ApiError, apiFetch: jest.fn() };
});

import { ApiError, apiFetch } from "@/lib/api/http";
import { notificationService } from "./service";

const fetchMock = jest.mocked(apiFetch);

const raw = (over: Record<string, unknown> = {}) => ({
  id: "n-1",
  type: "order_update",
  title: "Đặt hàng thành công",
  body: "Đơn hàng #A1B2C3D4 đã được tạo.",
  data: { order_id: "o-1" },
  is_read: false,
  created_at: "2026-11-24T03:00:00.000Z",
  ...over,
});

function backend(items: unknown[], unread: number, total = items.length) {
  fetchMock.mockImplementation(async (path: string) => {
    if (path === "/api/notifications/unread-count") return { count: unread };
    return { items, total, page: 2, limit: 10, totalPages: 1 };
  });
}

afterEach(() => jest.resetAllMocks());

describe("notificationService.list", () => {
  it("gọi đúng trang + số chưa đọc của toàn bộ, không gửi userId", async () => {
    backend([raw()], 7, 12);
    const list = await notificationService.list(2, 10);
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications?page=2&limit=10");
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/unread-count");
    expect(list).toMatchObject({ unread: 7, page: 2, total: 12 });
  });

  it("đơn hàng dẫn tới chi tiết đơn, theo dõi giá dẫn tới trang sản phẩm, còn lại không có link", async () => {
    backend(
      [
        raw(),
        raw({ id: "n-2", type: "price_alert", data: { product_id: "p-1", alert_id: "a-1" } }),
        raw({ id: "n-3", type: "system", data: null, body: null }),
      ],
      3,
    );
    const { items } = await notificationService.list();
    expect(items.map((n) => n.link)).toEqual(["/account/orders/o-1", "/products/p-1", null]);
    expect(items[2]?.body).toBe("");
  });
});

describe("notificationService.markRead", () => {
  it("không có ids thì đọc hết bằng read-all", async () => {
    fetchMock.mockResolvedValue({ updated: 3 });
    await notificationService.markRead();
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/read-all", { method: "PUT" });
  });

  it("có ids thì đánh dấu từng cái, bỏ qua id không tồn tại (404)", async () => {
    fetchMock.mockImplementation(async (path: string) => {
      if (path.includes("gone")) throw new ApiError(404, "Không tìm thấy thông báo", "NT-NTF-1001");
      return { is_read: true };
    });
    await expect(notificationService.markRead(["n-1", "gone"])).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/n-1/read", { method: "PUT" });
  });

  it("lỗi khác 404 thì ném tiếp", async () => {
    fetchMock.mockRejectedValue(new ApiError(503, "Không kết nối được máy chủ"));
    await expect(notificationService.markRead(["n-1"])).rejects.toMatchObject({ status: 503 });
  });
});
