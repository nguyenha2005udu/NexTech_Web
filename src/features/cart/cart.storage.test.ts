import { makeCartItem } from "@/lib/test-utils";
import { CART_STORAGE_KEY, loadCart, saveCart } from "./cart.storage";

describe("cart.storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("trả giỏ rỗng khi chưa lưu gì", () => {
    expect(loadCart(window.localStorage)).toEqual([]);
  });

  it("lưu rồi đọc lại đúng giỏ", () => {
    const items = [makeCartItem(), makeCartItem({ selected: false, quantity: 3 })];
    saveCart(window.localStorage, items);
    expect(loadCart(window.localStorage)).toEqual(items);
  });

  it("giỏ rỗng thì xoá khoá khỏi storage", () => {
    saveCart(window.localStorage, [makeCartItem()]);
    saveCart(window.localStorage, []);
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it.each([
    ["JSON hỏng", "{không phải json"],
    ["không phải mảng", JSON.stringify({ items: [] })],
  ])("trả giỏ rỗng khi dữ liệu %s", (_label, raw) => {
    window.localStorage.setItem(CART_STORAGE_KEY, raw);
    expect(loadCart(window.localStorage)).toEqual([]);
  });

  it("bỏ dòng sai cấu trúc và dòng trùng sản phẩm, giữ dòng hợp lệ", () => {
    const valid = makeCartItem({ productId: "a" });
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([valid, { ...valid, quantity: 2 }, { productId: "b", price: "rẻ" }, null]),
    );
    expect(loadCart(window.localStorage)).toEqual([valid]);
  });

  it("kẹp số lượng về giới hạn của dòng", () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([makeCartItem({ productId: "a", quantity: 9, maxQuantity: 5 })]),
    );
    expect(loadCart(window.localStorage)[0]?.quantity).toBe(5);
  });

  it("không ném lỗi khi trình duyệt chặn storage", () => {
    const blocked = {
      getItem: jest.fn(() => {
        throw new Error("SecurityError");
      }),
      setItem: jest.fn(() => {
        throw new Error("QuotaExceededError");
      }),
      removeItem: jest.fn(),
    } as unknown as Storage;
    expect(loadCart(blocked)).toEqual([]);
    expect(() => saveCart(blocked, [makeCartItem()])).not.toThrow();
  });
});
