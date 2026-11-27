/** @jest-environment node */
jest.mock("server-only", () => ({}));
const store = new Map<string, string>();
const set = jest.fn((name: string, value: string) => void store.set(name, value));
jest.mock("next/headers", () => ({
  cookies: async () => ({ set, get: (name: string) => (store.has(name) ? { value: store.get(name) } : undefined) }),
}));

import { PAYMENT_CONTEXT_COOKIE, PAYMENT_CONTEXT_MAX_AGE_SECONDS, readPaymentContext, writePaymentContext } from "./payment-context";

const ctx = { orderId: "aaaaaaaa-0000-4000-8000-000000000001", paymentId: "pay-1", method: "payos" as const };

beforeEach(() => {
  store.clear();
  set.mockClear();
});

describe("writePaymentContext", () => {
  it("ghi cookie httpOnly, SameSite=Lax, có hạn", async () => {
    await writePaymentContext(ctx);
    expect(set).toHaveBeenCalledWith(
      PAYMENT_CONTEXT_COOKIE,
      JSON.stringify(ctx),
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: PAYMENT_CONTEXT_MAX_AGE_SECONDS }),
    );
  });
});

describe("readPaymentContext", () => {
  it("đọc lại đúng thứ đã ghi", async () => {
    await writePaymentContext(ctx);
    expect(await readPaymentContext()).toEqual(ctx);
  });

  it("chấp nhận paymentId là null (đơn chưa có giao dịch)", async () => {
    await writePaymentContext({ ...ctx, paymentId: null });
    expect(await readPaymentContext()).toEqual({ ...ctx, paymentId: null });
  });

  it("không có cookie thì trả null", async () => {
    expect(await readPaymentContext()).toBeNull();
  });

  it.each([
    ["không phải JSON", "{{{"],
    ["thiếu trường", JSON.stringify({ orderId: "o-1" })],
    ["phương thức lạ", JSON.stringify({ ...ctx, method: "momo" })],
    ["orderId quá dài", JSON.stringify({ ...ctx, orderId: "x".repeat(65) })],
  ])("cookie bị sửa (%s) thì trả null, không ném lỗi", async (_label, raw) => {
    store.set(PAYMENT_CONTEXT_COOKIE, raw);
    expect(await readPaymentContext()).toBeNull();
  });
});
