/** @jest-environment node */
import { ApiError, apiFetch } from "@/lib/api/http";
import { adminOrderService } from "./admin-service";

jest.mock("@/lib/api/http", () => {
  const actual: typeof import("@/lib/api/http") = jest.requireActual("@/lib/api/http");
  return { ...actual, apiFetch: jest.fn() };
});

const mockFetch = jest.mocked(apiFetch);
const ID = "aaaaaaaa-0000-4000-8000-000000000002";

// Body thật của order-service (gọi thử 2026-11-20): cột tiền bigint là chuỗi
const rawDetail = {
  id: ID,
  user: { id: "u-2", full_name: "Người Mua", email: "buyer@nextech.local", phone_number: "0900000001" },
  items: [{ product: { id: "p-1", name: "Tai nghe NexTech Mini", price: "100000" }, quantity: 1 }],
  subtotal: "100000",
  shipping_fee: "30000",
  discount_amount: "0",
  total: "130000",
  status: "shipped",
  note: null,
  payment: {
    id: "pay-1",
    order_id: ID,
    method: "payos",
    transaction_id: null,
    amount: "130000",
    currency: "VND",
    status: "success",
    gateway_response: null,
    paid_at: "2026-11-20T03:06:03.097Z",
  },
  payment_expires_at: null,
  created_at: "2026-11-20T03:04:03.087Z",
};

describe("adminOrderService.list", () => {
  it("đổi total chuỗi sang number, chỉ gửi tham số có giá trị", async () => {
    mockFetch.mockResolvedValueOnce({
      items: [{ id: ID, user_name: "Người Mua", product_count: 1, total: "130000", status: "shipped", created_at: "x" }],
      total: 1,
      page: 2,
      limit: 20,
      totalPages: 1,
    });
    const page = await adminOrderService.list({ search: "", status: "shipped", page: 2, limit: 20 });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/orders?status=shipped&page=2&limit=20");
    expect(page.items[0]?.total).toBe(130_000);
    expect(page.total).toBe(1);
  });
});

describe("adminOrderService.get", () => {
  it("đổi mọi cột tiền sang number, payment chỉ giữ trường web dùng", async () => {
    mockFetch.mockResolvedValueOnce(rawDetail);
    const order = await adminOrderService.get(ID);
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/orders/${ID}`);
    expect(order).toMatchObject({ subtotal: 100_000, shipping_fee: 30_000, discount_amount: 0, total: 130_000 });
    expect(order.items[0]?.product.price).toBe(100_000);
    expect(order.payment).toEqual({
      id: "pay-1",
      method: "payos",
      status: "success",
      amount: 130_000,
      paid_at: "2026-11-20T03:06:03.097Z",
    });
  });

  it("chưa có giao dịch → payment null", async () => {
    mockFetch.mockResolvedValueOnce({ ...rawDetail, payment: null });
    await expect(adminOrderService.get(ID)).resolves.toMatchObject({ payment: null });
  });

  it("404 được ném tiếp cho page xử lý", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy đơn hàng", "NT-ORD-1006"));
    await expect(adminOrderService.get(ID)).rejects.toMatchObject({ status: 404 });
  });
});
