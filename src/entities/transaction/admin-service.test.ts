/** @jest-environment node */
import { ApiError, apiFetch } from "@/lib/api/http";
import { adminPaymentService } from "./admin-service";

jest.mock("@/lib/api/http", () => {
  const actual: typeof import("@/lib/api/http") = jest.requireActual("@/lib/api/http");
  return { ...actual, apiFetch: jest.fn() };
});

const mockFetch = jest.mocked(apiFetch);
const ID = "bbbbbbbb-0000-4000-8000-000000000003";
const ORDER_ID = "aaaaaaaa-0000-4000-8000-000000000002";

// Hình dạng body của order-service (services/order/src/modules/admin-payment): amount bigint là chuỗi
const rawItem = { id: ID, order_id: ORDER_ID, method: "cod", amount: "7990000", status: "pending", paid_at: null };

describe("adminPaymentService.list", () => {
  it("đổi amount chuỗi sang number, chỉ gửi tham số có giá trị", async () => {
    mockFetch.mockResolvedValueOnce({ items: [rawItem], total: 1, page: 2, limit: 20, totalPages: 1 });
    const page = await adminPaymentService.list({ method: "cod", status: undefined, page: 2, limit: 20 });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/payments?method=cod&page=2&limit=20");
    expect(page.items).toEqual([
      { id: ID, order_id: ORDER_ID, method: "cod", amount: 7_990_000, status: "pending", paid_at: null },
    ]);
    expect(page.total).toBe(1);
  });

  it("không tham số → gọi không query string; amount hỏng → 0", async () => {
    mockFetch.mockResolvedValueOnce({ items: [{ ...rawItem, amount: "abc" }], total: 1, page: 1, limit: 20, totalPages: 1 });
    const page = await adminPaymentService.list();
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/payments");
    expect(page.items[0]?.amount).toBe(0);
  });
});

describe("adminPaymentService.get", () => {
  it("bỏ gateway_response / transactions, giữ transaction_id + currency", async () => {
    mockFetch.mockResolvedValueOnce({
      ...rawItem,
      method: "payos",
      status: "success",
      amount: "130000",
      transaction_id: "123456789",
      currency: "VND",
      gateway_response: { code: "00" },
      paid_at: "2026-11-20T03:06:03.097Z",
      transactions: [{ id: "t-1" }],
    });
    await expect(adminPaymentService.get(ID)).resolves.toEqual({
      id: ID,
      order_id: ORDER_ID,
      method: "payos",
      amount: 130_000,
      status: "success",
      paid_at: "2026-11-20T03:06:03.097Z",
      transaction_id: "123456789",
      currency: "VND",
    });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/payments/${ID}`);
  });

  it("id được encode; thiếu currency → VND", async () => {
    mockFetch.mockResolvedValueOnce({ ...rawItem, transaction_id: null, currency: "" });
    const detail = await adminPaymentService.get("a/b");
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/payments/a%2Fb");
    expect(detail.currency).toBe("VND");
    expect(detail.transaction_id).toBeNull();
  });

  it("404 được ném tiếp cho page xử lý", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy giao dịch", "NT-PAY-1001"));
    await expect(adminPaymentService.get(ID)).rejects.toMatchObject({ status: 404 });
  });
});
