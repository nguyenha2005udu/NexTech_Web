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
import { orderService, paymentStatusOf } from "./service";

const fetchMock = apiFetch as jest.Mock;
type Call = [string, { method?: string; body?: unknown; headers?: Record<string, string> }?];
const calls = (): Call[] => fetchMock.mock.calls as Call[];
const pathsOf = (method: string) => calls().filter(([, i]) => (i?.method ?? "GET") === method).map(([p]) => p);

const P1 = "p-1";
const input = { items: [{ product_id: P1, quantity: 2 }], address_id: "addr-1", discount_code: null, freeship_code: null, payment_method: "cod" as const };

/** Dựng phản hồi theo đường dẫn; mặc định giỏ backend rỗng. */
function backend(over: Partial<Record<string, unknown>> = {}) {
  const table: Record<string, unknown> = {
    "GET /api/cart": { id: "cart", items: [] },
    "POST /api/cart/items": { id: "ci-new" },
    "POST /api/orders": { id: "o-1", status: "pending", total: 150000 },
    "POST /api/payments": { id: "pay-1", payment_url: null },
    ...over,
  };
  fetchMock.mockImplementation(async (path: string, init?: { method?: string }) => {
    const key = `${init?.method ?? "GET"} ${path}`;
    const hit = key in table ? table[key] : table[`${init?.method ?? "GET"} ${path.split("?")[0]}`];
    if (hit instanceof Error) throw hit;
    return hit;
  });
}

const rawDetail = (over: Record<string, unknown> = {}) => ({
  id: "o-1",
  status: "pending",
  created_at: "2026-11-26T03:00:00.000Z",
  subtotal: "120000",
  shipping_fee: "30000",
  discount_amount: "0",
  total: "150000",
  items: [{ product: { id: P1, name: "Tai nghe", price: "120000" }, quantity: 1 }],
  shipping_address: { full_address: "1 Đại Cồ Việt", recipient_name: null, phone_number: "0900000002" },
  ...over,
});

afterEach(() => jest.resetAllMocks());

describe("orderService.create", () => {
  it("đẩy dòng vào giỏ backend rồi đặt đúng dòng đó, kèm Idempotency-Key", async () => {
    backend();
    const order = await orderService.create(input);

    expect(calls().find(([p]) => p === "/api/cart/items")?.[1]?.body).toEqual({ product_id: P1, quantity: 2 });
    const [, ordersInit] = calls().find(([p]) => p === "/api/orders")!;
    expect(ordersInit?.body).toEqual({ address_id: "addr-1", cart_item_ids: ["ci-new"] });
    expect(ordersInit?.headers?.["Idempotency-Key"]).toEqual(expect.any(String));
    expect(order).toEqual({ id: "o-1", status: "pending", total: 150000, payment_method: "cod", checkout_url: null });
  });

  it("không gửi giá, phí ship hay tổng tiền lên backend", async () => {
    backend();
    await orderService.create(input);
    const body = calls().find(([p]) => p === "/api/orders")?.[1]?.body as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["address_id", "cart_item_ids"]);
  });

  it("giỏ backend đã có sản phẩm: dùng lại dòng đó, chỉ PUT khi số lượng khác", async () => {
    backend({ "GET /api/cart": { id: "cart", items: [{ id: "ci-old", product: { id: P1 }, quantity: 1 }] } });
    await orderService.create(input);
    expect(pathsOf("POST")).not.toContain("/api/cart/items");
    expect(calls().find(([p]) => p === "/api/cart/items/ci-old")?.[1]).toMatchObject({ method: "PUT", body: { quantity: 2 } });
    expect(calls().find(([p]) => p === "/api/orders")?.[1]?.body).toMatchObject({ cart_item_ids: ["ci-old"] });
  });

  it("số lượng trùng khớp thì không PUT", async () => {
    backend({ "GET /api/cart": { id: "cart", items: [{ id: "ci-old", product: { id: P1 }, quantity: 2 }] } });
    await orderService.create(input);
    expect(pathsOf("PUT")).toEqual([]);
  });

  it("có mã giảm giá thì gửi discount_code", async () => {
    backend();
    await orderService.create({ ...input, discount_code: "NEX200" });
    expect(calls().find(([p]) => p === "/api/orders")?.[1]?.body).toMatchObject({ discount_code: "NEX200" });
  });

  it("mã freeship gửi vào ô freeship_code riêng, không lẫn với discount_code", async () => {
    backend();
    await orderService.create({ ...input, freeship_code: "SHIP30" });
    const body = calls().find(([p]) => p === "/api/orders")?.[1]?.body as Record<string, unknown>;
    expect(body).toMatchObject({ freeship_code: "SHIP30" });
    expect(body).not.toHaveProperty("discount_code");
  });

  it("tạo giao dịch thanh toán theo phương thức đã chọn", async () => {
    backend();
    await orderService.create(input);
    expect(calls().find(([p]) => p === "/api/payments")?.[1]?.body).toEqual({ order_id: "o-1", method: "cod" });
  });

  it("PayOS: trả link thanh toán của backend", async () => {
    backend({ "POST /api/payments": { id: "pay-1", payment_url: "https://pay.payos.vn/abc" } });
    const order = await orderService.create({ ...input, payment_method: "payos" });
    expect(order.checkout_url).toBe("https://pay.payos.vn/abc");
  });

  it("COD: không bao giờ có checkout_url", async () => {
    backend({ "POST /api/payments": { id: "pay-1", payment_url: "https://x" } });
    expect((await orderService.create(input)).checkout_url).toBeNull();
  });

  it("202 (đơn còn processing): không tạo thanh toán", async () => {
    backend({ "POST /api/orders": { id: "o-1", status: "processing" } });
    const order = await orderService.create(input);
    expect(order).toMatchObject({ status: "processing", total: 0 });
    expect(pathsOf("POST")).not.toContain("/api/payments");
  });

  it("tạo thanh toán lỗi thì đơn vẫn được trả về, không ném lỗi", async () => {
    backend({ "POST /api/payments": new ApiError(503, "PayOS lỗi", "NT-PAY-1006") });
    expect(await orderService.create({ ...input, payment_method: "payos" })).toMatchObject({ id: "o-1", checkout_url: null });
  });

  it("lỗi backend khi đặt đơn được ném lên cho action xử lý", async () => {
    backend({ "POST /api/orders": new ApiError(400, "Giỏ hàng trống", "NT-ORD-1001") });
    await expect(orderService.create(input)).rejects.toMatchObject({ status: 400, code: "NT-ORD-1001" });
  });
});

describe("orderService — đọc đơn", () => {
  it("getDetailMine map chi tiết: tiền về số, trạng thái thanh toán suy từ đơn", async () => {
    fetchMock.mockResolvedValue(rawDetail());
    expect(await orderService.getDetailMine("o-1")).toMatchObject({
      id: "o-1",
      total: 150000,
      subtotal: 120000,
      shipping_fee: 30000,
      payment_method: null,
      payment_status: "pending",
      items: [{ product_id: P1, name: "Tai nghe", quantity: 1, unit_price: 120000 }],
      shipping: { recipient_name: "", phone_number: "0900000002", full_address: "1 Đại Cồ Việt" },
    });
  });

  it("getDetailMine gộp giảm phí vận chuyển vào dòng giảm giá để tổng cộng đúng", async () => {
    fetchMock.mockResolvedValue(rawDetail({ discount_amount: "12000", shipping_discount_amount: "30000", total: "108000" }));
    const order = await orderService.getDetailMine("o-1");
    expect(order).toMatchObject({ discount_amount: 42_000, total: 108_000 });
    expect((order?.subtotal ?? 0) + (order?.shipping_fee ?? 0) - (order?.discount_amount ?? 0)).toBe(108_000);
  });

  it.each([404, 400])("getDetailMine trả null khi backend báo %i", async (status) => {
    fetchMock.mockRejectedValue(new ApiError(status, "x"));
    expect(await orderService.getDetailMine("zz")).toBeNull();
  });

  it("getDetailMine ném lại lỗi khác", async () => {
    fetchMock.mockRejectedValue(new ApiError(503, "x"));
    await expect(orderService.getDetailMine("o-1")).rejects.toThrow();
  });

  it("getMine chỉ trả phần tóm tắt, null khi không có đơn", async () => {
    fetchMock.mockResolvedValueOnce(rawDetail({ status: "paid" }));
    expect(await orderService.getMine("o-1")).toEqual({
      id: "o-1",
      status: "paid",
      total: 150000,
      payment_method: null,
      payment_status: "success",
    });
    fetchMock.mockRejectedValueOnce(new ApiError(404, "x"));
    expect(await orderService.getMine("o-2")).toBeNull();
  });

  it("listMine gọi API kèm bộ lọc trạng thái và đổi tiền về số", async () => {
    fetchMock.mockResolvedValue({
      items: [{ id: "o-1", total: "800000", status: "paid", created_at: "x", item_count: 2, product_name: "A", product_image: null }],
      total: 1,
      page: 1,
    });
    const list = await orderService.listMine("paid");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/orders?status=paid&limit=100");
    expect(list[0]).toMatchObject({ id: "o-1", total: 800000, item_count: 2 });
  });
});

describe("orderService — huỷ và thanh toán lại", () => {
  it("cancel gọi PUT /api/orders/:id/cancel", async () => {
    fetchMock.mockResolvedValue({ id: "o-1", status: "cancelled" });
    await orderService.cancel("o-1");
    expect(fetchMock).toHaveBeenCalledWith("/api/orders/o-1/cancel", { method: "PUT" });
  });

  it("cancel để lỗi backend (vd. đơn không còn pending) nổi lên", async () => {
    fetchMock.mockRejectedValue(new ApiError(400, "Không huỷ được", "NT-ORD-1008"));
    await expect(orderService.cancel("o-1")).rejects.toMatchObject({ code: "NT-ORD-1008" });
  });

  it("retryPayment xin link PayOS mới", async () => {
    fetchMock.mockResolvedValue({ id: "pay-2", payment_url: "https://pay.payos.vn/new" });
    expect(await orderService.retryPayment("o-1")).toEqual({ checkout_url: "https://pay.payos.vn/new" });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ body: { order_id: "o-1", method: "payos" } });
  });
});

describe("paymentStatusOf", () => {
  it.each([
    ["paid", "success"],
    ["shipped", "success"],
    ["cancelled", "failed"],
    ["failed", "failed"],
    ["pending", "pending"],
    ["processing", "pending"],
  ] as const)("đơn %s → %s", (status, expected) => {
    expect(paymentStatusOf(status)).toBe(expected);
  });
});
