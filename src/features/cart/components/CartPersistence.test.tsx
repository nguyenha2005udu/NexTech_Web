import { act } from "@testing-library/react";
import { makeCartItem, makeProduct, renderWithProviders } from "@/lib/test-utils";
import { CART_STORAGE_KEY } from "../cart.storage";
import { addItem } from "../model/cartSlice";
import { CartPersistence } from "./CartPersistence";

const saved = () => JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]") as unknown[];

describe("CartPersistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("nạp giỏ đã lưu vào store sau khi mount", () => {
    const item = makeCartItem({ productId: "a" });
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([item]));
    const { store } = renderWithProviders(<CartPersistence />);
    expect(store.getState().cart).toEqual({ items: [item], hydrated: true });
  });

  it("không xoá giỏ đã lưu trước khi nạp xong", () => {
    const item = makeCartItem({ productId: "a" });
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([item]));
    renderWithProviders(<CartPersistence />);
    expect(saved()).toEqual([item]);
  });

  it("ghi lại localStorage khi giỏ thay đổi", () => {
    const { store } = renderWithProviders(<CartPersistence />);
    act(() => {
      store.dispatch(addItem({ product: makeProduct({ id: "p-new" }), quantity: 2 }));
    });
    expect(saved()).toEqual([expect.objectContaining({ productId: "p-new", quantity: 2 })]);
  });

  it("nạp lại khi tab khác sửa giỏ (sự kiện storage)", () => {
    const { store } = renderWithProviders(<CartPersistence />);
    const fromOtherTab = makeCartItem({ productId: "tab-2" });
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([fromOtherTab]));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: CART_STORAGE_KEY }));
    });
    expect(store.getState().cart.items).toEqual([fromOtherTab]);
  });

  it("bỏ qua sự kiện storage của khoá khác", () => {
    const { store } = renderWithProviders(<CartPersistence />);
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([makeCartItem()]));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "khac" }));
    });
    expect(store.getState().cart.items).toEqual([]);
  });
});
