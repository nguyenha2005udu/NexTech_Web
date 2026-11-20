/** @jest-environment node */
import { apiFetch } from "@/lib/api/http";
import { adminOrderService } from "@/entities/order/admin-service";
import { statisticsService } from "./service";

jest.mock("@/lib/api/http", () => ({ apiFetch: jest.fn() }));

const mockedFetch = jest.mocked(apiFetch);

describe("statisticsService", () => {
  it("overview gọi đúng endpoint", async () => {
    mockedFetch.mockResolvedValueOnce({ total_orders: 1 });
    await expect(statisticsService.overview()).resolves.toEqual({ total_orders: 1 });
    expect(mockedFetch).toHaveBeenCalledWith("/api/admin/statistics/overview");
  });

  it("revenueByMonth lọc từ đầu đến cuối năm, nhóm theo tháng", async () => {
    mockedFetch.mockResolvedValueOnce({ group_by: "month", items: [] });
    await statisticsService.revenueByMonth(2026);
    expect(mockedFetch).toHaveBeenCalledWith("/api/admin/statistics/revenue?groupBy=month&from=2026-01-01&to=2026-12-31");
  });
});

describe("adminOrderService.list", () => {
  it("chỉ gửi tham số có giá trị", async () => {
    mockedFetch.mockResolvedValueOnce({ items: [] });
    await adminOrderService.list({ page: 1, limit: 5, search: "", status: undefined });
    expect(mockedFetch).toHaveBeenCalledWith("/api/admin/orders?page=1&limit=5");
  });

  it("không có tham số thì không thêm dấu ?", async () => {
    mockedFetch.mockResolvedValueOnce({ items: [] });
    await adminOrderService.list();
    expect(mockedFetch).toHaveBeenCalledWith("/api/admin/orders");
  });
});
