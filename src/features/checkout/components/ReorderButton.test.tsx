import { screen } from "@testing-library/react";
import { App } from "antd";
import { makeProduct, renderWithProviders, setupUser } from "@/lib/test-utils";
import { reorderItems } from "../actions";
import { ReorderButton } from "./ReorderButton";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
jest.mock("../actions", () => ({ reorderItems: jest.fn() }));
const mockReorder = jest.mocked(reorderItems);

const asus = makeProduct({ id: "p-asus", slug: "asus", name: "ASUS Vivobook 15", price: 14_990_000 });
const mouse = makeProduct({ id: "p-mouse", slug: "mouse", name: "Chuột", price: 300_000 });

function setup() {
  const user = setupUser();
  const view = renderWithProviders(
    <App>
      <ReorderButton orderId="o-1" />
    </App>,
  );
  return { user, ...view };
}

afterEach(() => jest.clearAllMocks());

describe("ReorderButton", () => {
  it("nạp các sản phẩm của đơn vào giỏ với đúng số lượng rồi sang giỏ hàng", async () => {
    mockReorder.mockResolvedValue({ ok: true, data: { skipped: 0, lines: [{ product: asus, quantity: 2 }, { product: mouse, quantity: 1 }] } });
    const { user, store } = setup();
    await user.click(screen.getByRole("button", { name: "Đặt lại" }));

    expect(mockReorder).toHaveBeenCalledWith({ orderId: "o-1" });
    expect(store.getState().cart.items).toEqual([
      expect.objectContaining({ productId: "p-asus", quantity: 2, selected: true }),
      expect.objectContaining({ productId: "p-mouse", quantity: 1, selected: true }),
    ]);
    expect(push).toHaveBeenCalledWith("/cart");
  });

  it("một số sản phẩm đã hết hàng: vẫn nạp phần còn lại và báo số bị bỏ", async () => {
    mockReorder.mockResolvedValue({ ok: true, data: { skipped: 1, lines: [{ product: asus, quantity: 1 }] } });
    const { user, store } = setup();
    await user.click(screen.getByRole("button", { name: "Đặt lại" }));

    expect(store.getState().cart.items).toHaveLength(1);
    expect(await screen.findByText(/1 sản phẩm đã hết hàng hoặc ngừng bán/)).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/cart");
  });

  it("không còn sản phẩm nào bán được: báo lỗi, giỏ không đổi, không chuyển trang", async () => {
    mockReorder.mockResolvedValue({ ok: true, data: { skipped: 2, lines: [] } });
    const { user, store } = setup();
    await user.click(screen.getByRole("button", { name: "Đặt lại" }));

    expect(await screen.findByText("Các sản phẩm trong đơn này hiện không còn bán.")).toBeInTheDocument();
    expect(store.getState().cart.items).toEqual([]);
    expect(push).not.toHaveBeenCalled();
  });

  it("action lỗi: hiện thông báo, không chuyển trang", async () => {
    mockReorder.mockResolvedValue({ ok: false, message: "Không tìm thấy đơn hàng" });
    const { user, store } = setup();
    await user.click(screen.getByRole("button", { name: "Đặt lại" }));

    expect(await screen.findByText("Không tìm thấy đơn hàng")).toBeInTheDocument();
    expect(store.getState().cart.items).toEqual([]);
    expect(push).not.toHaveBeenCalled();
  });
});
