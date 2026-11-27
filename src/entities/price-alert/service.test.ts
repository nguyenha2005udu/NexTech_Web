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
import { priceAlertService } from "./service";

const fetchMock = jest.mocked(apiFetch);

const raw = (over: Record<string, unknown> = {}) => ({
  id: "a-1",
  product: { id: "p-1", name: "Tai nghe", price: "1500000", image: null },
  target_price: "1200000",
  status: "active",
  notify_channel: "app",
  created_at: "2026-11-25T00:00:00.000Z",
  ...over,
});

afterEach(() => jest.resetAllMocks());

describe("priceAlertService.listMine", () => {
  it("đổi giá về số, bỏ cảnh báo đã xoá (cancelled), giữ cảnh báo đã chạm mục tiêu", async () => {
    fetchMock.mockResolvedValue([raw(), raw({ id: "a-2", status: "cancelled" }), raw({ id: "a-3", status: "triggered" })]);
    const alerts = await priceAlertService.listMine();
    expect(fetchMock).toHaveBeenCalledWith("/api/price-alerts");
    expect(alerts).toEqual([
      { id: "a-1", product_id: "p-1", target_price: 1_200_000, status: "active", created_at: "2026-11-25T00:00:00.000Z" },
      { id: "a-3", product_id: "p-1", target_price: 1_200_000, status: "triggered", created_at: "2026-11-25T00:00:00.000Z" },
    ]);
  });
});

describe("priceAlertService.create", () => {
  it("gửi product_id + target_price, không gửi userId", async () => {
    fetchMock.mockResolvedValue({ id: "a-9", status: "active" });
    expect(await priceAlertService.create("p-1", 1_200_000)).toMatchObject({ id: "a-9" });
    expect(fetchMock).toHaveBeenCalledWith("/api/price-alerts", {
      method: "POST",
      body: { product_id: "p-1", target_price: 1_200_000 },
    });
  });
});

describe("priceAlertService.remove", () => {
  it("xoá thành công trả true", async () => {
    fetchMock.mockResolvedValue({ message: "Đã huỷ theo dõi giá" });
    expect(await priceAlertService.remove("a-1")).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/price-alerts/a-1", { method: "DELETE" });
  });

  it("không phải của mình / không có (404) trả false", async () => {
    fetchMock.mockRejectedValue(new ApiError(404, "Không tìm thấy theo dõi giá", "NT-CAT-1009"));
    expect(await priceAlertService.remove("a-x")).toBe(false);
  });

  it("lỗi khác thì ném tiếp", async () => {
    fetchMock.mockRejectedValue(new ApiError(503, "Không kết nối được máy chủ"));
    await expect(priceAlertService.remove("a-1")).rejects.toMatchObject({ status: 503 });
  });
});
