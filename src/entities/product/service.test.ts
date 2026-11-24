/** @jest-environment node */
import { productService } from "./service";

describe("productService.getManyByIds", () => {
  it("trả sản phẩm theo id, bỏ qua id không tồn tại", async () => {
    const products = await productService.getManyByIds(["p-asus-vivobook-15", "khong-co"]);
    expect(products.map((p) => p.id)).toEqual(["p-asus-vivobook-15"]);
  });
});
