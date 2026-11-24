/** @jest-environment node */
import { productService } from "@/entities/product/service";
import { makeProduct } from "@/lib/test-utils";
import { getCartSnapshots } from "./actions";

jest.mock("@/entities/product/service", () => ({ productService: { getManyByIds: jest.fn() } }));
const mockProducts = jest.mocked(productService.getManyByIds);

afterEach(() => jest.clearAllMocks());

describe("getCartSnapshots", () => {
  it("trả giá và tồn kho hiện tại của sản phẩm", async () => {
    mockProducts.mockResolvedValue([makeProduct({ id: "p-a", price: 100, stockQuantity: 3 })]);
    expect(await getCartSnapshots({ productIds: ["p-a"] })).toEqual({
      ok: true,
      data: [{ productId: "p-a", price: 100, stockQuantity: 3, available: true }],
    });
  });

  it.each([
    ["hết hàng", { inStock: false }],
    ["tồn kho bằng 0", { stockQuantity: 0 }],
  ])("đánh dấu không còn bán khi %s", async (_label, override) => {
    mockProducts.mockResolvedValue([makeProduct({ id: "p-a", ...override })]);
    const result = await getCartSnapshots({ productIds: ["p-a"] });
    expect(result).toMatchObject({ ok: true, data: [{ available: false }] });
  });

  it("giỏ rỗng không gọi service", async () => {
    expect(await getCartSnapshots({ productIds: [] })).toEqual({ ok: true, data: [] });
    expect(mockProducts).not.toHaveBeenCalled();
  });

  it.each([{}, { productIds: "p-a" }, { productIds: Array.from({ length: 51 }, (_, i) => `p-${i}`) }])(
    "từ chối đầu vào sai %#",
    async (input) => {
      expect(await getCartSnapshots(input)).toMatchObject({ ok: false });
      expect(mockProducts).not.toHaveBeenCalled();
    },
  );
});
