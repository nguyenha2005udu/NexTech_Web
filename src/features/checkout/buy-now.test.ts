import { makeProduct } from "@/lib/test-utils";
import { parseBuyNowParams, toBuyNowLine } from "./buy-now";

describe("parseBuyNowParams", () => {
  it("không có buyNow thì trả null", () => {
    expect(parseBuyNowParams({})).toBeNull();
    expect(parseBuyNowParams({ buyNow: "  " })).toBeNull();
  });

  it("đọc slug và số lượng", () => {
    expect(parseBuyNowParams({ buyNow: "asus-vivobook-15", qty: "2" })).toEqual({ slug: "asus-vivobook-15", quantity: 2 });
  });

  it.each([
    ["thiếu", undefined, 1],
    ["không phải số", "abc", 1],
    ["số lẻ", "1.5", 1],
    ["âm", "-3", 1],
    ["vượt giới hạn", "99", 10],
  ])("số lượng %s → %s", (_label, qty, expected) => {
    expect(parseBuyNowParams({ buyNow: "x", qty })?.quantity).toBe(expected);
  });

  it("lấy giá trị đầu khi tham số bị lặp", () => {
    expect(parseBuyNowParams({ buyNow: ["a", "b"], qty: ["3", "4"] })).toEqual({ slug: "a", quantity: 3 });
  });
});

describe("toBuyNowLine", () => {
  it("đổi sản phẩm còn hàng thành dòng đặt hàng", () => {
    const product = makeProduct({ id: "p-1", name: "ASUS", price: 100, images: [{ src: "/a.svg", alt: "" }] });
    expect(toBuyNowLine(product, 2)).toEqual({
      productId: "p-1",
      name: "ASUS",
      summary: product.summary,
      imageSrc: "/a.svg",
      price: 100,
      quantity: 2,
    });
  });

  it("không có sản phẩm hoặc hết hàng thì trả null", () => {
    expect(toBuyNowLine(null, 1)).toBeNull();
    expect(toBuyNowLine(makeProduct({ inStock: false }), 1)).toBeNull();
  });

  it("kẹp số lượng theo tồn kho", () => {
    expect(toBuyNowLine(makeProduct({ stockQuantity: 2 }), 5)?.quantity).toBe(2);
  });

  it("tồn kho bằng 0 thì không cho mua ngay", () => {
    expect(toBuyNowLine(makeProduct({ stockQuantity: 0 }), 1)).toBeNull();
  });
});
