import { screen } from "@testing-library/react";
import { makeCartItem, renderWithProviders, setupUser } from "@/lib/test-utils";
import { CartItemRow } from "./CartItemRow";

function renderRow(override: Parameters<typeof makeCartItem>[0] = {}) {
  const item = makeCartItem({ productId: "a", slug: "asus", name: "ASUS Vivobook 15", price: 14_990_000, ...override });
  const user = setupUser();
  // Dòng nhận `item` qua props (CartView truyền từ store); test kiểm action được dispatch vào store.
  const view = renderWithProviders(
    <ul>
      <CartItemRow item={item} />
    </ul>,
    { preloadedState: { cart: { items: [item], hydrated: true } } },
  );
  return { user, item, ...view };
}

describe("CartItemRow", () => {
  it("hiện tên (link tới trang sản phẩm), cấu hình và thành tiền theo số lượng", () => {
    renderRow({ quantity: 2 });
    expect(screen.getByRole("link", { name: "ASUS Vivobook 15" })).toHaveAttribute("href", "/products/asus");
    expect(screen.getByText(/SL 2/)).toBeInTheDocument();
    expect(screen.getByText("29.980.000 ₫")).toBeInTheDocument();
  });

  it("bấm tăng thì cập nhật số lượng trong store", async () => {
    const { user, store } = renderRow({ quantity: 2 });
    await user.click(screen.getByRole("button", { name: "Tăng số lượng" }));
    expect(store.getState().cart.items[0]?.quantity).toBe(3);
  });

  it("bấm giảm thì cập nhật số lượng trong store", async () => {
    const { user, store } = renderRow({ quantity: 2 });
    await user.click(screen.getByRole("button", { name: "Giảm số lượng" }));
    expect(store.getState().cart.items[0]?.quantity).toBe(1);
  });

  it("khoá nút giảm khi số lượng là 1", () => {
    renderRow({ quantity: 1 });
    expect(screen.getByRole("button", { name: "Giảm số lượng" })).toBeDisabled();
  });

  it("khoá nút tăng khi chạm giới hạn", () => {
    renderRow({ quantity: 10, maxQuantity: 10 });
    expect(screen.getByRole("button", { name: "Tăng số lượng" })).toBeDisabled();
  });

  it("bỏ chọn dòng khi bấm checkbox", async () => {
    const { user, store } = renderRow();
    await user.click(screen.getByRole("checkbox", { name: "Chọn ASUS Vivobook 15 để đặt hàng" }));
    expect(store.getState().cart.items[0]?.selected).toBe(false);
  });

  it("xoá sản phẩm khỏi giỏ", async () => {
    const { user, store } = renderRow();
    await user.click(screen.getByRole("button", { name: "Xóa ASUS Vivobook 15 khỏi giỏ" }));
    expect(store.getState().cart.items).toEqual([]);
  });
});
