import { act, screen, waitFor } from "@testing-library/react";
import { makeCartItem, renderWithProviders, setupUser } from "@/lib/test-utils";
import { getCartSnapshots } from "../actions";
import { CartView } from "./CartView";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

jest.mock("../actions", () => ({ getCartSnapshots: jest.fn() }));
const mockSnapshots = jest.mocked(getCartSnapshots);

let sessionUser: unknown = null;
beforeEach(() => {
  sessionUser = null;
  // Mặc định server trả đúng giá/tồn kho đang lưu trong giỏ → không có gì thay đổi.
  mockSnapshots.mockImplementation(async (input) => ({
    ok: true,
    data: (input as { productIds: string[] }).productIds.map((id) => ({
      productId: id,
      price: id === "a" ? 14_990_000 : 15_490_000,
      available: true,
    })),
  }));
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ user: sessionUser }) }),
  ) as unknown as typeof fetch;
});

const asus = makeCartItem({ productId: "a", name: "ASUS Vivobook 15", price: 14_990_000 });
const lenovo = makeCartItem({ productId: "b", name: "Lenovo IdeaPad Slim 5", price: 15_490_000, selected: false });

function renderCart(items = [asus, lenovo], hydrated = true) {
  const user = setupUser();
  return { user, ...renderWithProviders(<CartView />, { preloadedState: { cart: { items, hydrated } } }) };
}

describe("CartView", () => {
  it("hiện khung chờ khi chưa nạp giỏ từ localStorage", () => {
    renderCart([asus], false);
    expect(screen.getByLabelText("Đang tải giỏ hàng")).toBeInTheDocument();
    expect(screen.queryByText("Chưa có sản phẩm trong giỏ")).not.toBeInTheDocument();
  });

  it("giỏ trống thì mời khám phá sản phẩm (03.02)", () => {
    renderCart([]);
    expect(screen.getByRole("heading", { name: "Chưa có sản phẩm trong giỏ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Khám phá sản phẩm/ })).toHaveAttribute("href", "/search");
  });

  it("liệt kê sản phẩm và chỉ tính tạm tính các dòng được chọn", () => {
    renderCart();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Đã chọn 1 sản phẩm")).toBeInTheDocument();
    expect(screen.getAllByText("14.990.000 ₫").length).toBeGreaterThanOrEqual(2);
  });

  it("'Chọn tất cả' chọn mọi dòng", async () => {
    const { user, store } = renderCart();
    await user.click(screen.getByRole("checkbox", { name: /Chọn tất cả \(2\)/ }));
    expect(store.getState().cart.items.every((i) => i.selected)).toBe(true);
    expect(screen.getByText("Đã chọn 2 sản phẩm")).toBeInTheDocument();
  });

  it("khách: hiện lưu ý và bấm đặt hàng thì mở hộp 'Đăng nhập để đặt hàng' (03.03)", async () => {
    const { user } = renderCart();
    expect(await screen.findByText(/Bạn sẽ cần đăng nhập để đặt hàng/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tiến hành đặt hàng/ }));
    expect(await screen.findByRole("dialog", { name: "Đăng nhập để đặt hàng" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Đăng nhập/ }));
    expect(push).toHaveBeenCalledWith("/login?callbackUrl=%2Fcheckout");
  });

  it("khách bấm 'Tiếp tục xem giỏ' thì đóng hộp thoại, không chuyển trang", async () => {
    const { user } = renderCart();
    await screen.findByText(/Bạn sẽ cần đăng nhập để đặt hàng/);
    await user.click(screen.getByRole("button", { name: /Tiến hành đặt hàng/ }));
    await user.click(await screen.findByRole("button", { name: "Tiếp tục xem giỏ" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });

  it("đã đăng nhập: không hiện lưu ý, bấm đặt hàng đi thẳng tới /checkout", async () => {
    sessionUser = { full_name: "Minh Anh", role: "user" };
    const { user } = renderCart();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // Chờ fetch → json → setState xong để chắc đang ở nhánh "đã đăng nhập", không phải "chưa biết".
    await act(() => Promise.resolve());
    await user.click(screen.getByRole("button", { name: /Tiến hành đặt hàng/ }));
    expect(push).toHaveBeenCalledWith("/checkout");
    expect(screen.queryByText(/Bạn sẽ cần đăng nhập/)).not.toBeInTheDocument();
  });

  describe("đối chiếu giá và tồn kho với server", () => {
    it("hỏi server theo các sản phẩm trong giỏ sau khi nạp giỏ", async () => {
      renderCart();
      await waitFor(() => expect(mockSnapshots).toHaveBeenCalledWith({ productIds: ["a", "b"] }));
    });

    it("không hỏi server khi giỏ trống hoặc chưa nạp xong", () => {
      renderCart([]);
      renderCart([asus], false);
      expect(mockSnapshots).not.toHaveBeenCalled();
    });

    it("giá đổi thì hiện cảnh báo và cập nhật tạm tính", async () => {
      mockSnapshots.mockResolvedValue({ ok: true, data: [{ productId: "a", price: 13_990_000, available: true }] });
      renderCart([asus]);
      expect(await screen.findByText(/Giá đã giảm từ 14.990.000 ₫ còn 13.990.000 ₫/)).toBeInTheDocument();
    });

    it("hết hàng thì bỏ chọn, khoá ô chọn và báo cho người dùng", async () => {
      mockSnapshots.mockResolvedValue({ ok: true, data: [{ productId: "a", price: 14_990_000, available: false }] });
      const { store } = renderCart([asus]);
      expect(await screen.findByText(/đã hết hàng hoặc ngừng bán/)).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /Chọn ASUS Vivobook 15/ })).toBeDisabled();
      expect(store.getState().cart.items[0]?.selected).toBe(false);
    });

    it("tồn kho giảm thì kẹp số lượng và hiện 'Chỉ còn'", async () => {
      mockSnapshots.mockResolvedValue({
        ok: true,
        data: [{ productId: "a", price: 14_990_000, stockQuantity: 2, available: true }],
      });
      const { store } = renderCart([{ ...asus, quantity: 5 }]);
      expect(await screen.findByText("Chỉ còn 2 sản phẩm.")).toBeInTheDocument();
      expect(store.getState().cart.items[0]?.quantity).toBe(2);
    });

    it("lỗi mạng thì giữ nguyên giỏ", async () => {
      mockSnapshots.mockRejectedValue(new Error("network"));
      const { store } = renderCart([asus]);
      await waitFor(() => expect(mockSnapshots).toHaveBeenCalled());
      expect(store.getState().cart.items[0]).toMatchObject({ price: 14_990_000, quantity: 1 });
    });
  });
});
