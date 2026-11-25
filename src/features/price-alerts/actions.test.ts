/** @jest-environment node */
import { priceAlertService } from "@/entities/price-alert/service";
import { productService } from "@/entities/product/service";
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
  priceAlertService: { listMine: jest.fn(), upsert: jest.fn(), remove: jest.fn() },
}));

const mockSession = jest.mocked(getSessionUser);
const mockProducts = jest.mocked(productService.getManyByIds);
const mockList = jest.mocked(priceAlertService.listMine);
const mockUpsert = jest.mocked(priceAlertService.upsert);
const mockRemove = jest.mocked(priceAlertService.remove);

const user: SessionUser = { id: "u-1", email: "a@example.com", full_name: "A", role: "user", avatar_url: null };
const asus = makeProduct({ id: "p-asus", price: 14_990_000 });
const alert = { id: "al-1", product_id: "p-asus", target_price: 13_000_000, created_at: "2026-11-25T00:00:00Z", triggered_at: null };

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  mockProducts.mockResolvedValue([asus]);
  mockList.mockResolvedValue([]);
  mockUpsert.mockResolvedValue(alert);
  mockRemove.mockResolvedValue(true);
});
afterEach(() => jest.clearAllMocks());

describe("createPriceAlert", () => {
  it("khách chưa đăng nhập bị chuyển tới /login", async () => {
    mockSession.mockResolvedValue(null);
    await expect(createPriceAlert({ productId: "p-asus", targetPrice: 1 })).rejects.toThrow("REDIRECT:/login");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it.each([
    ["thiếu giá", { productId: "p-asus" }],
    ["giá âm", { productId: "p-asus", targetPrice: -5 }],
    ["giá thập phân", { productId: "p-asus", targetPrice: 1.5 }],
    ["giá là chuỗi", { productId: "p-asus", targetPrice: "13000000" }],
  ])("từ chối khi %s", async (_label, input) => {
    expect(await createPriceAlert(input)).toMatchObject({ ok: false });
    expect(mockUpsert).not.toHaveBeenCalled();
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
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("tạo cảnh báo hợp lệ", async () => {
    expect(await createPriceAlert({ productId: "p-asus", targetPrice: 13_000_000 })).toEqual({
      ok: true,
      data: { alertId: "al-1" },
    });
    expect(mockUpsert).toHaveBeenCalledWith("p-asus", 13_000_000);
  });

  it("đủ 20 cảnh báo thì không cho thêm sản phẩm mới", async () => {
    mockList.mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({ ...alert, id: `a${i}`, product_id: `p${i}` })));
    expect(await createPriceAlert({ productId: "p-asus", targetPrice: 13_000_000 })).toMatchObject({ ok: false });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("đủ 20 cảnh báo vẫn sửa được giá của sản phẩm đã theo dõi", async () => {
    mockList.mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({ ...alert, id: `a${i}`, product_id: i ? `p${i}` : "p-asus" })));
    expect(await createPriceAlert({ productId: "p-asus", targetPrice: 12_000_000 })).toMatchObject({ ok: true });
  });
});

describe("removePriceAlert", () => {
  it("khách chưa đăng nhập bị chuyển tới /login", async () => {
    mockSession.mockResolvedValue(null);
    await expect(removePriceAlert({ alertId: "al-1" })).rejects.toThrow("REDIRECT:/login");
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("đầu vào thiếu id bị từ chối", async () => {
    expect(await removePriceAlert({})).toMatchObject({ ok: false });
  });

  it("xoá thành công", async () => {
    expect(await removePriceAlert({ alertId: "al-1" })).toEqual({ ok: true });
    expect(mockRemove).toHaveBeenCalledWith("al-1");
  });

  it("id không thuộc người dùng", async () => {
    mockRemove.mockResolvedValue(false);
    expect(await removePriceAlert({ alertId: "al-x" })).toEqual({ ok: false, message: "Không tìm thấy cảnh báo giá" });
  });
});
