import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "antd";
import { makeProduct, renderWithProviders } from "@/lib/test-utils";
import { MAX_QUANTITY_PER_ITEM } from "../model/cartSlice";
import { PurchaseActions } from "./PurchaseActions";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const product = makeProduct({ id: "p-asus", slug: "asus-vivobook-15", name: "ASUS Vivobook 15" });

function setup(inStock = true) {
  const user = userEvent.setup();
  const view = renderWithProviders(
    <App>
      <PurchaseActions product={product} inStock={inStock} />
    </App>,
  );
  return { user, ...view };
}

describe("PurchaseActions", () => {
  it("thêm số lượng đã chọn vào giỏ và báo thành công", async () => {
    const { user, store } = setup();
    await user.click(screen.getByRole("button", { name: "Tăng số lượng" }));
    await user.click(screen.getByRole("button", { name: "Tăng số lượng" }));
    await user.click(screen.getByRole("button", { name: /Thêm vào giỏ/ }));

    expect(store.getState().cart.items).toEqual([expect.objectContaining({ productId: "p-asus", quantity: 3 })]);
    expect(await screen.findByText(/Đã thêm 3 × ASUS Vivobook 15 vào giỏ/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem giỏ hàng" })).toHaveAttribute("href", "/cart");
  });

  it("'Mua ngay' chuyển tới checkout với sản phẩm và số lượng, không thêm vào giỏ", async () => {
    const { user, store } = setup();
    await user.click(screen.getByRole("button", { name: "Tăng số lượng" }));
    await user.click(screen.getByRole("button", { name: /Mua ngay/ }));

    expect(push).toHaveBeenCalledWith("/checkout?buyNow=asus-vivobook-15&qty=2");
    expect(store.getState().cart.items).toEqual([]);
  });

  it("không giảm dưới 1 và không tăng quá giới hạn", async () => {
    const { user } = setup();
    expect(screen.getByRole("button", { name: "Giảm số lượng" })).toBeDisabled();

    const increase = screen.getByRole("button", { name: "Tăng số lượng" });
    for (let i = 1; i < MAX_QUANTITY_PER_ITEM; i += 1) await user.click(increase);

    expect(screen.getByLabelText("Số lượng đã chọn")).toHaveTextContent(String(MAX_QUANTITY_PER_ITEM));
    expect(increase).toBeDisabled();
  });

  it("hết hàng thì khoá cả hai nút và báo tạm hết hàng", () => {
    setup(false);
    expect(screen.getByRole("button", { name: /Mua ngay/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Thêm vào giỏ/ })).toBeDisabled();
    expect(screen.getByText("Sản phẩm tạm hết hàng.")).toBeInTheDocument();
  });
});
