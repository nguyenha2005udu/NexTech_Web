/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/lib/api/http", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/http";
import { couponService } from "./service";

const fetchMock = apiFetch as jest.Mock;

const sale10 = {
  code: "SALE10",
  description: "Giảm 10%, tối đa 200.000đ",
  category: "order",
  discount_type: "percent",
  discount_value: "10",
  min_order_value: null,
  max_discount: "200000",
  valid_until: null,
};
const ship30 = {
  code: "SHIP30",
  description: "Giảm 30.000đ phí ship",
  category: "free_shipping",
  discount_type: "fixed_amount",
  discount_value: "30000",
  min_order_value: "100000",
  max_discount: null,
  valid_until: "2026-12-31T00:00:00.000Z",
};

afterEach(() => jest.resetAllMocks());

describe("couponService.listAvailable", () => {
  beforeEach(() => {
    fetchMock.mockImplementation(async (path: string) =>
      path.startsWith("/api/discount-codes/freeship")
        ? { items: [ship30], total: 1 }
        : { items: [sale10], total: 1 },
    );
  });

  it("gộp mã giảm đơn và mã freeship của backend", async () => {
    const list = await couponService.listAvailable();
    expect(list.map((c) => c.code)).toEqual(["SALE10", "SHIP30"]);
    expect(list.map((c) => c.category)).toEqual(["order", "free_shipping"]);
  });

  it("đổi các cột tiền (chuỗi) về số, giữ null", async () => {
    const [sale, ship] = await couponService.listAvailable();
    expect(sale).toMatchObject({ discount_value: 10, max_discount: 200000, min_order_value: null });
    expect(ship).toMatchObject({ discount_value: 30000, min_order_value: 100000, valid_until: "2026-12-31T00:00:00.000Z" });
  });

  it("mã backend trả về coi là đang bật, không có valid_from", async () => {
    expect((await couponService.listAvailable())[0]).toMatchObject({ is_active: true, valid_from: null });
  });
});

describe("couponService.validate", () => {
  it("gửi mã, tạm tính và phí ship; mã hợp lệ trả loại mã và số tiền giảm", async () => {
    fetchMock.mockResolvedValue({ is_valid: true, code: "SALE10", category: "order", discount_amount: 100000 });
    const result = await couponService.validate(" SALE10 ", 1_000_000, 30_000);
    expect(fetchMock).toHaveBeenCalledWith("/api/discount-codes/validate", {
      method: "POST",
      body: { code: "SALE10", order_value: 1_000_000, shipping_fee: 30_000 },
    });
    expect(result).toEqual({ valid: true, code: "SALE10", category: "order", discountAmount: 100000 });
  });

  it("mã sai là HTTP 200 với is_valid false: trả lý do của backend", async () => {
    fetchMock.mockResolvedValue({ is_valid: false, code: "KHONGCO", message: "Mã giảm giá không tồn tại" });
    expect(await couponService.validate("KHONGCO", 1, 0)).toEqual({ valid: false, message: "Mã giảm giá không tồn tại" });
  });
});
