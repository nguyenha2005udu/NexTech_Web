import { makeCartItem, makeProduct } from "@/lib/test-utils";
import {
  MAX_QUANTITY_PER_ITEM,
  addItem,
  cartReducer,
  clearCart,
  hydrateCart,
  initialCartState,
  removeItem,
  setAllSelected,
  toggleSelected,
  updateQuantity,
  type CartState,
} from "./cartSlice";

const withItems = (...items: ReturnType<typeof makeCartItem>[]): CartState => ({ items, hydrated: true });

describe("cartSlice — addItem", () => {
  const product = makeProduct({ id: "p-asus", slug: "asus", name: "ASUS Vivobook 15", price: 14_990_000 });

  it("thêm sản phẩm mới với thông tin hiển thị và đánh dấu được chọn", () => {
    const state = cartReducer(initialCartState, addItem({ product, quantity: 2 }));
    expect(state.items).toEqual([
      expect.objectContaining({ productId: "p-asus", slug: "asus", price: 14_990_000, quantity: 2, selected: true }),
    ]);
  });

  it("thêm trùng thì cộng dồn số lượng, không tạo dòng mới", () => {
    let state = cartReducer(initialCartState, addItem({ product, quantity: 1 }));
    state = cartReducer(state, addItem({ product, quantity: 3 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(4);
  });

  it("thêm trùng cập nhật giá mới nhất và chọn lại dòng đó", () => {
    const before = withItems(makeCartItem({ productId: "p-asus", price: 1, selected: false }));
    const state = cartReducer(before, addItem({ product, quantity: 1 }));
    expect(state.items[0]).toMatchObject({ price: 14_990_000, selected: true });
  });

  it("không vượt giới hạn số lượng mỗi sản phẩm", () => {
    let state = cartReducer(initialCartState, addItem({ product, quantity: MAX_QUANTITY_PER_ITEM + 5 }));
    expect(state.items[0]?.quantity).toBe(MAX_QUANTITY_PER_ITEM);
    state = cartReducer(state, addItem({ product, quantity: 1 }));
    expect(state.items[0]?.quantity).toBe(MAX_QUANTITY_PER_ITEM);
  });

  it.each([0, -1, Number.NaN])("bỏ qua số lượng không hợp lệ (%s)", (quantity) => {
    expect(cartReducer(initialCartState, addItem({ product, quantity }))).toEqual(initialCartState);
  });

  it("làm tròn xuống số lượng lẻ", () => {
    const state = cartReducer(initialCartState, addItem({ product, quantity: 2.7 }));
    expect(state.items[0]?.quantity).toBe(2);
  });

  it("sản phẩm không có ảnh vẫn thêm được", () => {
    const state = cartReducer(initialCartState, addItem({ product: makeProduct({ images: [] }), quantity: 1 }));
    expect(state.items[0]?.imageSrc).toBeUndefined();
  });
});

describe("cartSlice — removeItem / updateQuantity", () => {
  const a = makeCartItem({ productId: "a", quantity: 2 });
  const b = makeCartItem({ productId: "b" });

  it("xoá đúng sản phẩm", () => {
    expect(cartReducer(withItems(a, b), removeItem("a")).items).toEqual([b]);
  });

  it("xoá id không tồn tại thì giỏ giữ nguyên", () => {
    expect(cartReducer(withItems(a, b), removeItem("x")).items).toEqual([a, b]);
  });

  it("cập nhật số lượng trong giới hạn 1..max", () => {
    expect(cartReducer(withItems(a), updateQuantity({ productId: "a", quantity: 5 })).items[0]?.quantity).toBe(5);
    expect(cartReducer(withItems(a), updateQuantity({ productId: "a", quantity: 0 })).items[0]?.quantity).toBe(1);
    expect(cartReducer(withItems(a), updateQuantity({ productId: "a", quantity: 99 })).items[0]?.quantity).toBe(10);
  });

  it("cập nhật id không tồn tại hoặc số không hợp lệ thì bỏ qua", () => {
    const state = withItems(a);
    expect(cartReducer(state, updateQuantity({ productId: "x", quantity: 3 }))).toEqual(state);
    expect(cartReducer(state, updateQuantity({ productId: "a", quantity: Number.NaN }))).toEqual(state);
  });
});

describe("cartSlice — chọn sản phẩm, xoá giỏ, nạp giỏ", () => {
  it("toggleSelected đảo trạng thái chọn của một dòng", () => {
    const state = cartReducer(withItems(makeCartItem({ productId: "a" })), toggleSelected("a"));
    expect(state.items[0]?.selected).toBe(false);
    expect(cartReducer(state, toggleSelected("x"))).toEqual(state);
  });

  it("setAllSelected chọn / bỏ chọn tất cả", () => {
    const state = withItems(makeCartItem({ selected: false }), makeCartItem());
    expect(cartReducer(state, setAllSelected(true)).items.every((i) => i.selected)).toBe(true);
    expect(cartReducer(state, setAllSelected(false)).items.some((i) => i.selected)).toBe(false);
  });

  it("clearCart xoá hết nhưng giữ cờ hydrated", () => {
    expect(cartReducer(withItems(makeCartItem()), clearCart())).toEqual({ items: [], hydrated: true });
  });

  it("hydrateCart thay giỏ và bật cờ hydrated", () => {
    const saved = [makeCartItem()];
    expect(cartReducer(initialCartState, hydrateCart(saved))).toEqual({ items: saved, hydrated: true });
  });
});
