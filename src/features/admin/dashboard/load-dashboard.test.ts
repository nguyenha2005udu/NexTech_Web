/** @jest-environment node */
import { adminOrderService } from "@/entities/order/admin-service";
import { mockAdminOrders } from "@/entities/order/mock-data";
import { mockOverview, mockRevenueItems } from "@/entities/statistics/mock-data";
import { statisticsService } from "@/entities/statistics/service";
import { ApiError } from "@/lib/api/http";
import { loadDashboard } from "./load-dashboard";

jest.mock("@/entities/statistics/service", () => ({
  statisticsService: { overview: jest.fn(), revenueByMonth: jest.fn() },
}));
jest.mock("@/entities/order/admin-service", () => ({ adminOrderService: { list: jest.fn() } }));

const overview = jest.mocked(statisticsService.overview);
const revenue = jest.mocked(statisticsService.revenueByMonth);
const list = jest.mocked(adminOrderService.list);
const notFound = () => new ApiError(404, "Cannot GET /api/admin/statistics/overview", "NT-GEN-0004");
const page = { items: mockAdminOrders, total: 5, page: 1, limit: 5, totalPages: 1 };

beforeEach(() => {
  overview.mockResolvedValue(mockOverview);
  revenue.mockResolvedValue({ group_by: "month", items: mockRevenueItems(2026) });
  list.mockResolvedValue(page);
});

describe("loadDashboard", () => {
  it("đủ dữ liệu → failed rỗng; gọi doanh thu theo năm và 5 đơn mới nhất", async () => {
    const data = await loadDashboard(2026);
    expect(data.failed).toEqual([]);
    expect(data.overview).toBe(mockOverview);
    expect(data.revenue).toHaveLength(mockRevenueItems(2026).length);
    expect(revenue).toHaveBeenCalledWith(2026);
    expect(list).toHaveBeenCalledWith({ page: 1, limit: 5 });
  });

  it("backend chưa có API thống kê (404) → thẻ số null, doanh thu rỗng, đơn mới nhất vẫn có", async () => {
    overview.mockRejectedValue(notFound());
    revenue.mockRejectedValue(notFound());
    const data = await loadDashboard(2026);
    expect(data.failed).toEqual(["overview", "revenue"]);
    expect(data.overview).toMatchObject({ total_orders: null, total_revenue: null, total_users: null, orders_by_status: [] });
    expect(data.revenue).toEqual([]);
    expect(data.latestOrders).toBe(mockAdminOrders);
  });

  it("danh sách đơn lỗi (503) → bảng rỗng, đánh dấu orders", async () => {
    list.mockRejectedValue(new ApiError(503, "Không kết nối được máy chủ"));
    const data = await loadDashboard(2026);
    expect(data.failed).toEqual(["orders"]);
    expect(data.latestOrders).toEqual([]);
  });

  it("lỗi không phải ApiError (lỗi lập trình) được ném tiếp", async () => {
    overview.mockRejectedValue(new TypeError("boom"));
    await expect(loadDashboard(2026)).rejects.toThrow("boom");
  });
});
