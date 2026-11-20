/** @jest-environment node */
import { apiFetch } from "@/lib/api/http";
import { adminCouponService } from "./admin-service";

jest.mock("@/lib/api/http", () => ({ apiFetch: jest.fn() }));

const mockFetch = jest.mocked(apiFetch);

// Body thật của promotion-service (gọi thử 2026-11-20): cột bigint là chuỗi
const raw = {
  id: "c22e5c86-715a-43a1-b459-cb91ccec43f4",
  code: "GIAM50K",
  description: null,
  category: "order",
  discount_type: "fixed_amount",
  discount_value: "50000",
  min_order_value: "1000000",
  max_discount: null,
  usage_limit: 200,
  used_count: 88,
  valid_from: null,
  valid_until: "2026-09-30T16:59:59.000Z",
  is_active: true,
  status: "running",
};

describe("adminCouponService.list", () => {
  it("đổi tiền chuỗi sang number, giữ null; chỉ gửi tham số có giá trị", async () => {
    mockFetch.mockResolvedValueOnce({ items: [raw], total: 1, page: 1, limit: 20, totalPages: 1 });
    const page = await adminCouponService.list({ search: "", status: "running", page: 1, limit: 20 });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/discount-codes?status=running&page=1&limit=20");
    expect(page.items[0]).toMatchObject({ discount_value: 50_000, min_order_value: 1_000_000, max_discount: null });
  });
});
