import { makeStore } from "@/lib/store";
import { makeCartItem } from "@/lib/test-utils";
import {
  selectCartCount,
  selectCartHydrated,
  selectIsAllSelected,
  selectSelectedItems,
  selectSelectedSubtotal,
} from "./selectors";

function stateWith(items: ReturnType<typeof makeCartItem>[]) {
  return makeStore({ cart: { items, hydrated: true } }).getState();
}

describe("selector giỏ hàng", () => {
  const a = makeCartItem({ price: 10_000_000, quantity: 2 });
  const b = makeCartItem({ price: 3_000_000, quantity: 1, selected: false });

  it("đếm tổng số lượng (badge header)", () => {
    expect(selectCartCount(stateWith([a, b]))).toBe(3);
    expect(selectCartCount(stateWith([]))).toBe(0);
  });

  it("chỉ tính tạm tính các dòng được chọn", () => {
    const state = stateWith([a, b]);
    expect(selectSelectedItems(state)).toEqual([a]);
    expect(selectSelectedSubtotal(state)).toBe(20_000_000);
  });

  it("selectIsAllSelected sai khi giỏ rỗng hoặc có dòng chưa chọn", () => {
    expect(selectIsAllSelected(stateWith([]))).toBe(false);
    expect(selectIsAllSelected(stateWith([a, b]))).toBe(false);
    expect(selectIsAllSelected(stateWith([a]))).toBe(true);
  });

  it("trả cùng tham chiếu khi state không đổi (memo)", () => {
    const state = stateWith([a, b]);
    expect(selectSelectedItems(state)).toBe(selectSelectedItems(state));
  });

  it("giỏ mới tạo chưa hydrated", () => {
    expect(selectCartHydrated(makeStore().getState())).toBe(false);
  });
});
