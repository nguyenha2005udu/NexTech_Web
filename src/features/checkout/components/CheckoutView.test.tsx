import { screen, waitFor, within } from "@testing-library/react";
import type { Address } from "@/entities/address";
import type { Coupon } from "@/entities/coupon";
import { useGetNotificationsQuery } from "@/features/notifications";
import { makeCartItem, renderWithProviders, setupUser } from "@/lib/test-utils";
import { placeOrder } from "../actions";
import type { CheckoutLine } from "../types";
import { CheckoutView } from "./CheckoutView";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
jest.mock("../actions", () => ({ placeOrder: jest.fn() }));
const mockPlaceOrder = jest.mocked(placeOrder);

const home: Address = {
  id: "addr-home",
  label: "Nhà riêng",
  recipient_name: "Minh Anh",
  phone_number: "090 000 0000",
  full_address: "123 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh",
  is_default: true,
};
const office: Address = { ...home, id: "addr-office", label: "Văn phòng", full_address: "45 Điện Biên Phủ", is_default: false };

const coupon = (override: Partial<Coupon>): Coupon => ({
  code: "NEX200",
  description: "Giảm 200.000 ₫ cho đơn từ 10 triệu",
  category: "order",
  discount_type: "fixed_amount",
  discount_value: 200_000,
  min_order_value: 10_000_000,
  max_discount: null,
  valid_from: null,
  valid_until: null,
  is_active: true,
  ...override,
});
const coupons = [coupon({}), coupon({ code: "BIG", description: "Cho đơn từ 50 triệu", min_order_value: 50_000_000 })];

const asus = makeCartItem({ productId: "p-asus", name: "ASUS Vivobook 15", price: 14_990_000 });
const unselected = makeCartItem({ productId: "p-lenovo", name: "Lenovo IdeaPad Slim 5", selected: false });

function renderCheckout({
  addresses = [home, office],
  buyNow = null,
  cart = [asus, unselected],
}: { addresses?: Address[]; buyNow?: CheckoutLine | null; cart?: ReturnType<typeof makeCartItem>[] } = {}) {
  const user = setupUser();
  const view = renderWithProviders(<CheckoutView addresses={addresses} coupons={coupons} buyNow={buyNow} />, {
    preloadedState: { cart: { items: cart, hydrated: true } },
  });
  return { user, ...view };
}

const summary = () => within(screen.getByRole("complementary", { name: "Tóm tắt đơn hàng" }));

describe("CheckoutView — hiển thị", () => {
  it("chỉ lấy các dòng đang chọn trong giỏ, tổng = tạm tính + phí vận chuyển", () => {
    renderCheckout();
    expect(screen.getByText("ASUS Vivobook 15")).toBeInTheDocument();
    expect(screen.queryByText("Lenovo IdeaPad Slim 5")).not.toBeInTheDocument();
    expect(summary().getByText("30.000 ₫")).toBeInTheDocument();
    expect(summary().getByText("15.020.000 ₫")).toBeInTheDocument();
  });

  it("'Mua ngay' bỏ qua giỏ, chỉ đặt sản phẩm được truyền vào", () => {
    renderCheckout({ buyNow: { productId: "p-acer", name: "Acer Aspire 5", summary: "Core i5", price: 13_490_000, quantity: 2 } });
    expect(screen.getByText("Acer Aspire 5")).toBeInTheDocument();
    expect(screen.queryByText("ASUS Vivobook 15")).not.toBeInTheDocument();
    expect(summary().getByText("26.980.000 ₫")).toBeInTheDocument();
  });

  it("chưa chọn sản phẩm nào thì mời quay lại giỏ", () => {
    renderCheckout({ cart: [unselected] });
    expect(screen.getByRole("link", { name: "Quay lại giỏ hàng" })).toHaveAttribute("href", "/cart");
  });

  it("chưa có địa chỉ: mời thêm địa chỉ và khoá nút đặt hàng", () => {
    renderCheckout({ addresses: [] });
    expect(screen.getByRole("link", { name: "Thêm địa chỉ" })).toHaveAttribute("href", "/account/addresses");
    expect(summary().getByRole("button", { name: /Đặt hàng/ })).toBeDisabled();
  });

  it("chọn PayOS thì nút đổi thành 'Tiếp tục đến PayOS' (03.07)", async () => {
    const { user } = renderCheckout();
    await user.click(screen.getByRole("radio", { name: /PayOS/ }));
    expect(summary().getByRole("button", { name: /Tiếp tục đến PayOS/ })).toBeInTheDocument();
  });
});

describe("CheckoutView — hộp thoại", () => {
  it("đổi địa chỉ qua hộp 'Chọn địa chỉ giao hàng' (03.05)", async () => {
    const { user } = renderCheckout();
    await user.click(screen.getByRole("button", { name: "Đổi địa chỉ" }));
    const dialog = await screen.findByRole("dialog", { name: "Chọn địa chỉ giao hàng" });
    await user.click(within(dialog).getByRole("radio", { name: /Văn phòng/ }));
    await user.click(within(dialog).getByRole("button", { name: "Dùng địa chỉ này" }));
    expect(await screen.findByText("45 Điện Biên Phủ")).toBeInTheDocument();
  });

  it("bấm Hủy thì không đổi địa chỉ, mở lại hộp bắt đầu từ địa chỉ đang dùng", async () => {
    const { user } = renderCheckout();
    await user.click(screen.getByRole("button", { name: "Đổi địa chỉ" }));
    let dialog = await screen.findByRole("dialog", { name: "Chọn địa chỉ giao hàng" });
    await user.click(within(dialog).getByRole("radio", { name: /Văn phòng/ }));
    await user.click(within(dialog).getByRole("button", { name: "Hủy" }));
    expect(screen.getByText(home.full_address)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Đổi địa chỉ" }));
    dialog = await screen.findByRole("dialog", { name: "Chọn địa chỉ giao hàng" });
    expect(within(dialog).getByRole("radio", { name: /Nhà riêng/ })).toBeChecked();
  });

  it("chọn mã NEX200 thì giảm 200.000 ₫ (03.06 → tổng 14.820.000 ₫)", async () => {
    const { user } = renderCheckout();
    await user.click(screen.getByRole("button", { name: "Chọn mã" }));
    const dialog = await screen.findByRole("dialog", { name: "Chọn mã giảm giá" });
    await user.click(within(dialog).getByRole("radio", { name: /NEX200/ }));
    await user.click(within(dialog).getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByText("Đã áp dụng giảm 200.000 ₫")).toBeInTheDocument();
    expect(summary().getByText("14.820.000 ₫")).toBeInTheDocument();
  });

  it("mã chưa đủ điều kiện bị khoá và hiện lý do", async () => {
    const { user } = renderCheckout();
    await user.click(screen.getByRole("button", { name: "Chọn mã" }));
    const dialog = await screen.findByRole("dialog", { name: "Chọn mã giảm giá" });
    expect(within(dialog).getByRole("radio", { name: /BIG/ })).toBeDisabled();
    expect(within(dialog).getByText(/Đơn tối thiểu 50.000.000 ₫/)).toBeInTheDocument();
  });

  it("gõ mã không tồn tại thì báo lỗi", async () => {
    const { user } = renderCheckout();
    await user.click(screen.getByRole("button", { name: "Chọn mã" }));
    const dialog = await screen.findByRole("dialog", { name: "Chọn mã giảm giá" });
    await user.type(within(dialog).getByRole("textbox", { name: "Nhập mã giảm giá" }), "khongco");
    await user.click(within(dialog).getByRole("button", { name: "Áp dụng" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Mã giảm giá không tồn tại");
  });
});

describe("CheckoutView — đặt hàng", () => {
  it("gửi id + số lượng (không gửi giá), bỏ dòng đã đặt khỏi giỏ rồi chuyển trang", async () => {
    mockPlaceOrder.mockResolvedValue({
      ok: true,
      data: { orderId: "o-1", redirectTo: "/checkout/result?orderCode=o-1", productIds: ["p-asus"] },
    });
    const { user, store } = renderCheckout();
    await user.click(summary().getByRole("button", { name: /Đặt hàng/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/checkout/result?orderCode=o-1"));
    expect(mockPlaceOrder).toHaveBeenCalledWith({
      items: [{ productId: "p-asus", quantity: 1 }],
      addressId: "addr-home",
      couponCodes: [],
      paymentMethod: "cod",
    });
    expect(store.getState().cart.items.map((i) => i.productId)).toEqual(["p-lenovo"]);
  });

  it("đặt xong thì làm mới chuông thông báo (refetch ngay, không chờ polling)", async () => {
    const fetchMock = jest.fn(async () => new Response(JSON.stringify({ items: [], unread: 0 }), { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    function BellProbe() {
      useGetNotificationsQuery();
      return null;
    }
    mockPlaceOrder.mockResolvedValue({
      ok: true,
      data: { orderId: "o-3", redirectTo: "/checkout/result?orderCode=o-3", productIds: ["p-asus"] },
    });
    const user = setupUser();
    renderWithProviders(
      <>
        <BellProbe />
        <CheckoutView addresses={[home, office]} coupons={coupons} buyNow={null} />
      </>,
      { preloadedState: { cart: { items: [asus], hydrated: true } } },
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await user.click(summary().getByRole("button", { name: /Đặt hàng/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("'Mua ngay' đặt xong không đụng tới giỏ", async () => {
    mockPlaceOrder.mockResolvedValue({
      ok: true,
      data: { orderId: "o-2", redirectTo: "/checkout/result?orderCode=o-2", productIds: ["p-acer"] },
    });
    const { user, store } = renderCheckout({
      buyNow: { productId: "p-acer", name: "Acer Aspire 5", summary: "Core i5", price: 13_490_000, quantity: 1 },
    });
    await user.click(summary().getByRole("button", { name: /Đặt hàng/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(store.getState().cart.items).toHaveLength(2);
  });

  it("server từ chối mã giảm giá thì báo lỗi và bỏ mã", async () => {
    mockPlaceOrder.mockResolvedValue({
      ok: false,
      message: "Mã giảm giá đã hết hạn",
      fieldErrors: { couponCodes: "Mã giảm giá đã hết hạn" },
    });
    const { user } = renderCheckout();
    await user.click(screen.getByRole("button", { name: "Chọn mã" }));
    const dialog = await screen.findByRole("dialog", { name: "Chọn mã giảm giá" });
    await user.click(within(dialog).getByRole("radio", { name: /NEX200/ }));
    await user.click(within(dialog).getByRole("button", { name: "Xác nhận" }));
    await user.click(summary().getByRole("button", { name: /Đặt hàng/ }));

    expect(await screen.findByText("Mã giảm giá đã hết hạn")).toBeInTheDocument();
    expect(await screen.findByText("Chưa áp dụng mã giảm giá.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
