/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/entities/order/service", () => ({ orderService: { getMine: jest.fn(), getPaymentStatus: jest.fn() } }));
jest.mock("./payment-context", () => ({ readPaymentContext: jest.fn() }));

import { orderService } from "@/entities/order/service";
import type { MyOrderSummary } from "@/entities/order";
import { loadPaymentResult } from "./load-payment-result";
import { readPaymentContext } from "./payment-context";

const mockContext = jest.mocked(readPaymentContext);
const mockGetMine = jest.mocked(orderService.getMine);
const mockStatus = jest.mocked(orderService.getPaymentStatus);

const ORDER_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const OTHER_ID = "bbbbbbbb-0000-4000-8000-000000000002";
const order = (over: Partial<MyOrderSummary> = {}): MyOrderSummary => ({
  id: ORDER_ID,
  status: "pending",
  total: 150_000,
  payment_method: null,
  payment_status: "pending",
  ...over,
});
const payosContext = { orderId: ORDER_ID, paymentId: "pay-1", method: "payos" as const };

beforeEach(() => {
  mockContext.mockResolvedValue(null);
  mockGetMine.mockResolvedValue(order());
  mockStatus.mockResolvedValue("pending");
});
afterEach(() => jest.resetAllMocks());

describe("loadPaymentResult — xác định đơn", () => {
  it("PayOS quay về với orderCode là mã số: bỏ qua, dùng orderId trong cookie", async () => {
    mockContext.mockResolvedValue(payosContext);
    await loadPaymentResult({ orderCode: "123456789" });
    expect(mockGetMine).toHaveBeenCalledWith(ORDER_ID);
  });

  it("COD: orderCode là UUID do web tạo thì dùng được kể cả khi không còn cookie", async () => {
    await loadPaymentResult({ orderCode: ORDER_ID, method: "cod" });
    expect(mockGetMine).toHaveBeenCalledWith(ORDER_ID);
  });

  it("không có UUID và không có cookie thì trả null, không gọi backend", async () => {
    expect(await loadPaymentResult({ orderCode: "123456789" })).toBeNull();
    expect(await loadPaymentResult({})).toBeNull();
    expect(mockGetMine).not.toHaveBeenCalled();
  });

  it("đơn không thuộc người dùng (backend trả null) thì trả null", async () => {
    mockGetMine.mockResolvedValue(null);
    expect(await loadPaymentResult({ orderCode: ORDER_ID })).toBeNull();
  });

  it("cookie của đơn khác không bị dùng cho đơn này", async () => {
    mockContext.mockResolvedValue({ ...payosContext, orderId: OTHER_ID });
    const result = await loadPaymentResult({ orderCode: ORDER_ID });
    expect(mockStatus).not.toHaveBeenCalled();
    expect(result?.payment_method).toBeNull();
  });
});

describe("loadPaymentResult — phương thức thanh toán", () => {
  it("lấy từ cookie, ưu tiên hơn ?method= trên URL", async () => {
    mockContext.mockResolvedValue({ ...payosContext, method: "cod", paymentId: null });
    expect((await loadPaymentResult({ orderCode: ORDER_ID, method: "payos" }))?.payment_method).toBe("cod");
  });

  it("hết cookie thì dùng gợi ý ?method= hợp lệ, bỏ qua giá trị lạ", async () => {
    expect((await loadPaymentResult({ orderCode: ORDER_ID, method: "cod" }))?.payment_method).toBe("cod");
    expect((await loadPaymentResult({ orderCode: ORDER_ID, method: "momo" }))?.payment_method).toBeNull();
  });
});

describe("loadPaymentResult — trạng thái thanh toán thật", () => {
  it("PayOS: hỏi trạng thái giao dịch TRƯỚC khi đọc đơn để đơn đã được backend đồng bộ", async () => {
    mockContext.mockResolvedValue(payosContext);
    await loadPaymentResult({ orderCode: "123456789" });
    expect(mockStatus).toHaveBeenCalledWith("pay-1");
    expect(mockStatus.mock.invocationCallOrder[0]).toBeLessThan(mockGetMine.mock.invocationCallOrder[0] ?? 0);
  });

  it("PayOS đã trả tiền: payment_status là success theo backend", async () => {
    mockContext.mockResolvedValue(payosContext);
    mockStatus.mockResolvedValue("success");
    mockGetMine.mockResolvedValue(order({ status: "paid", payment_status: "success" }));
    expect(await loadPaymentResult({ orderCode: "1" })).toMatchObject({ status: "paid", payment_status: "success", payment_method: "payos" });
  });

  it("PayOS huỷ giữa chừng: giao dịch failed dù đơn vẫn pending", async () => {
    mockContext.mockResolvedValue(payosContext);
    mockStatus.mockResolvedValue("failed");
    expect(await loadPaymentResult({ orderCode: "1" })).toMatchObject({ status: "pending", payment_status: "failed" });
  });

  it("giao dịch còn pending thì giữ trạng thái suy ra từ đơn", async () => {
    mockContext.mockResolvedValue(payosContext);
    expect((await loadPaymentResult({ orderCode: "1" }))?.payment_status).toBe("pending");
  });

  it("không tin ?status=PAID trên URL", async () => {
    mockContext.mockResolvedValue(payosContext);
    const result = await loadPaymentResult({ orderCode: "1", status: "PAID" } as never);
    expect(result?.payment_status).toBe("pending");
  });

  it("giao dịch không thuộc người dùng (null) thì dùng trạng thái của đơn", async () => {
    mockContext.mockResolvedValue(payosContext);
    mockStatus.mockResolvedValue(null);
    expect((await loadPaymentResult({ orderCode: "1" }))?.payment_status).toBe("pending");
  });

  it.each([
    ["COD", { ...payosContext, method: "cod" as const }],
    ["chưa có giao dịch", { ...payosContext, paymentId: null }],
  ])("%s: không hỏi trạng thái giao dịch", async (_label, ctx) => {
    mockContext.mockResolvedValue(ctx);
    await loadPaymentResult({ orderCode: ORDER_ID });
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it("lỗi backend không lường trước được ném lên (không nuốt)", async () => {
    mockContext.mockResolvedValue(payosContext);
    mockStatus.mockRejectedValue(new Error("boom"));
    await expect(loadPaymentResult({ orderCode: "1" })).rejects.toThrow("boom");
  });
});
