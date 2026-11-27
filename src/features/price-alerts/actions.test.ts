/** @jest-environment node */
import { priceAlertService } from "@/entities/price-alert/service";
import { productService } from "@/entities/product/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { makeProduct } from "@/lib/test-utils";
import { createPriceAlert, removePriceAlert } from "./actions";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/product/service", () => ({ productService: { getManyByIds: jest.fn() } }));
jest.mock("@/entities/price-alert/service", () => ({
  priceAlertService: { listMine: jest.fn(), create: jest.fn(), remove: jest.fn() },
}));
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
  return { ApiError };
});

const mockSession = jest.mocked(getSessionUser);
const mockProducts = jest.mocked(productService.getManyByIds);
const mockList = jest.mocked(priceAlertService.listMine);
const mockCreate = jest.mocked(priceAlertService.create);
const mockRemove = jest.mocked(priceAlertService.remove);

const user: SessionUser = { id: "u-1", email: "a@example.com", full_name: "A", role: "user", avatar_url: null };
const asus = makeProduct({ id: "p-asus", price: 14_990_000 });
const ALERT_ID = "0b8e7c52-5f1e-4a7e-9a40-2f7a3c1d9e01";
const alert = { id: ALERT_ID, product_id: "p-asus", target_price: 13_000_000, created_at: "2026-11-25T00:00:00Z", status: "active" as const };

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  mockProducts.mockResolvedValue([asus]);
  mockList.mockResolvedValue([]);
  mockCreate.mockResolvedValue({ id: ALERT_ID });
  mockRemove.mockResolvedValue(true);
});
afterEach(() => jest.clearAllMocks());

describe("createPriceAlert", () => {
  it("khách chưa đăng nhập bị chuyển tới /login", async () => {
    mockSession.mockResolvedValue(null);
    await expect(createPriceAlert({ productId: "p-asus", targetPrice: 1 })).rejects.toThrow("REDIRECT:/login");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["thiếu giá", { productId: "p-asus" }],
    ["giá âm", { productId: "p-asus", targetPrice: -5 }],
    ["giá thập phân", { productId: "p-asus", targetPrice: 1.5 }],
    ["giá là chuỗi", { productId: "p-asus", targetPrice: "13000000" }],
  ])("từ chối khi %s", async (_label, input) => {
    expect(await createPriceAlert(input)).toMatchObject({ ok: false });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("sản phẩm không còn bán", async () => {
    mockProducts.mockResolvedValue([]);
    expect(await createPriceAlert({ productId: "p-x", targetPrice: 1_000 })).toEqual({
      ok: false,
      message: "Sản phẩm không còn được bán",
    });
  });

  it("giá mục tiêu không thấp hơn giá hiện tại thì báo lỗi vào ô giá", async () => {
    const result = await createPriceAlert({ productId: "p-asus", targetPrice: 14_990_000 });
    expect(result).toMatchObject({ ok: false, fieldErrors: { targetPrice: expect.stringContaining("14.990.000") } });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("tạo cảnh báo hợp lệ", async () => {
    expect(await createPriceAlert({ productId: "p-asus", targetPrice: 13_000_000 })).toEqual({
      ok: true,
      data: { alertId: ALERT_ID },
    });
    expect(mockCreate).toHaveBeenCalledWith("p-asus", 13_000_000);
  });

  it("đủ 20 cảnh báo đang theo dõi thì không cho thêm", async () => {
    mockList.mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({ ...alert, id: `a${i}`, product_id: `p${i}` })));
    expect(await createPriceAlert({ productId: "p-asus", targetPrice: 13_000_000 })).toMatchObject({ ok: false });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("cảnh báo đã chạm mục tiêu không tính vào giới hạn 20", async () => {
    mockList.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({ ...alert, id: `a${i}`, product_id: `p${i}`, status: "triggered" as const })),
    );
    expect(await createPriceAlert({ productId: "p-asus", targetPrice: 13_000_000 })).toMatchObject({ ok: true });
  });

  it("đang theo dõi sản phẩm này rồi (409 NT-CAT-1008) thì báo vào ô giá", async () => {
    mockCreate.mockRejectedValue(new ApiError(409, "Bạn đang theo dõi giá sản phẩm này rồi", "NT-CAT-1008"));
    expect(await createPriceAlert({ productId: "p-asus", targetPrice: 13_000_000 })).toEqual({
      ok: false,
      message: "Bạn đang theo dõi giá sản phẩm này rồi",
      fieldErrors: { targetPrice: "Bạn đang theo dõi giá sản phẩm này rồi" },
    });
  });
});

describe("removePriceAlert", () => {
  it("khách chưa đăng nhập bị chuyển tới /login", async () => {
    mockSession.mockResolvedValue(null);
    await expect(removePriceAlert({ alertId: ALERT_ID })).rejects.toThrow("REDIRECT:/login");
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it.each([
    ["thiếu id", {}],
    ["id không phải UUID", { alertId: "al-1" }],
  ])("từ chối khi %s, không gọi backend", async (_label, input) => {
    expect(await removePriceAlert(input)).toMatchObject({ ok: false });
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("xoá thành công", async () => {
    expect(await removePriceAlert({ alertId: ALERT_ID })).toEqual({ ok: true });
    expect(mockRemove).toHaveBeenCalledWith(ALERT_ID);
  });

  it("id không thuộc người dùng", async () => {
    mockRemove.mockResolvedValue(false);
    expect(await removePriceAlert({ alertId: ALERT_ID })).toEqual({ ok: false, message: "Không tìm thấy cảnh báo giá" });
  });
});
