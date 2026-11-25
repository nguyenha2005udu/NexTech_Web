/** @jest-environment node */
import { notificationService } from "@/entities/notification/service";
import { productService } from "@/entities/product/service";
import { makeProduct } from "@/lib/test-utils";
import { priceAlertService } from "./service";

jest.mock("@/entities/product/service", () => ({ productService: { getManyByIds: jest.fn() } }));
jest.mock("@/entities/notification/service", () => ({ notificationService: { push: jest.fn() } }));

const mockProducts = jest.mocked(productService.getManyByIds);
const mockPush = jest.mocked(notificationService.push);
const asus = makeProduct({ id: "p-asus", slug: "asus-vivobook-15", name: "ASUS Vivobook 15", price: 14_990_000 });

async function clearAll() {
  for (const a of await priceAlertService.listMine()) await priceAlertService.remove(a.id);
}

beforeEach(async () => {
  mockProducts.mockResolvedValue([asus]);
  await clearAll();
  jest.clearAllMocks();
});

describe("priceAlertService", () => {
  it("tạo cảnh báo mới với trạng thái đang theo dõi", async () => {
    const alert = await priceAlertService.upsert("p-asus", 13_000_000);
    expect(alert).toMatchObject({ product_id: "p-asus", target_price: 13_000_000, triggered_at: null });
    expect(await priceAlertService.count()).toBe(1);
  });

  it("đặt lại giá cho cùng sản phẩm thì ghi đè, không tạo thêm", async () => {
    const first = await priceAlertService.upsert("p-asus", 13_000_000);
    const second = await priceAlertService.upsert("p-asus", 12_000_000);
    expect(second.id).toBe(first.id);
    expect(second.target_price).toBe(12_000_000);
    expect(await priceAlertService.count()).toBe(1);
  });

  it("liệt kê cảnh báo mới nhất trước", async () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date("2026-11-01T00:00:00Z"));
      await priceAlertService.upsert("p-old", 1);
      jest.setSystemTime(new Date("2026-11-02T00:00:00Z"));
      await priceAlertService.upsert("p-new", 1);
    } finally {
      jest.useRealTimers();
    }
    mockProducts.mockResolvedValue([]);
    expect((await priceAlertService.listMine()).map((a) => a.product_id)).toEqual(["p-new", "p-old"]);
  });

  it("xoá cảnh báo; id lạ trả false", async () => {
    const alert = await priceAlertService.upsert("p-asus", 13_000_000);
    expect(await priceAlertService.remove("khong-co")).toBe(false);
    expect(await priceAlertService.remove(alert.id)).toBe(true);
    expect(await priceAlertService.count()).toBe(0);
  });
});

describe("priceAlertService.evaluate (giả lập job 6.1.4)", () => {
  it("giá còn cao hơn mục tiêu thì không báo", async () => {
    await priceAlertService.upsert("p-asus", 13_000_000);
    await priceAlertService.evaluate();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("giá chạm mục tiêu thì sinh thông báo dẫn tới sản phẩm, và chỉ báo một lần", async () => {
    await priceAlertService.upsert("p-asus", 13_000_000);
    mockProducts.mockResolvedValue([{ ...asus, price: 12_990_000 }]);

    await priceAlertService.evaluate();
    await priceAlertService.evaluate();

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ type: "price_alert", link: "/products/asus-vivobook-15" }),
    );
    expect((await priceAlertService.listMine())[0]?.triggered_at).not.toBeNull();
  });

  it("đặt lại giá mục tiêu thì theo dõi lại từ đầu", async () => {
    await priceAlertService.upsert("p-asus", 13_000_000);
    mockProducts.mockResolvedValue([{ ...asus, price: 12_000_000 }]);
    await priceAlertService.evaluate();
    await priceAlertService.upsert("p-asus", 11_000_000);
    expect((await priceAlertService.listMine())[0]?.triggered_at).toBeNull();
  });

  it("sản phẩm không còn bán thì bỏ qua", async () => {
    await priceAlertService.upsert("p-gone", 1_000);
    mockProducts.mockResolvedValue([]);
    await priceAlertService.evaluate();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
