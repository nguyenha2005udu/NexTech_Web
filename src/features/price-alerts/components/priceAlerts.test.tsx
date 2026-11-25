import { screen, waitFor, within } from "@testing-library/react";
import type { PriceAlert } from "@/entities/price-alert";
import { makeProduct, renderWithProviders, setupUser } from "@/lib/test-utils";
import { createPriceAlert, removePriceAlert } from "../actions";
import { PriceAlertButton } from "./PriceAlertButton";
import { PriceAlertList } from "./PriceAlertList";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
jest.mock("../actions", () => ({ createPriceAlert: jest.fn(), removePriceAlert: jest.fn() }));
const mockCreate = jest.mocked(createPriceAlert);
const mockRemove = jest.mocked(removePriceAlert);

afterEach(() => jest.clearAllMocks());

const alert = (override: Partial<PriceAlert> = {}): PriceAlert => ({
  id: "al-1",
  product_id: "p-asus",
  target_price: 13_000_000,
  created_at: "2026-11-24T03:00:00.000Z",
  triggered_at: null,
  ...override,
});
const asus = makeProduct({ id: "p-asus", slug: "asus-vivobook-15", name: "ASUS Vivobook 15", price: 14_990_000 });

describe("PriceAlertButton", () => {
  async function openDialog() {
    const user = setupUser();
    renderWithProviders(<PriceAlertButton productId="p-asus" productName="ASUS Vivobook 15" price={14_990_000} />);
    await user.click(screen.getByRole("button", { name: /Theo dõi giá/ }));
    const dialog = await screen.findByRole("dialog", { name: "Cảnh báo giá" });
    return { user, dialog };
  }

  it("mở hộp thoại kèm giá hiện tại", async () => {
    const { dialog } = await openDialog();
    expect(within(dialog).getByText(/14\.990\.000 ₫/)).toBeInTheDocument();
  });

  it("chưa nhập giá thì báo lỗi, không gọi server", async () => {
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getByRole("button", { name: "Đặt cảnh báo" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Nhập giá mục tiêu");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("giá không thấp hơn giá hiện tại thì báo lỗi ngay ở client", async () => {
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByRole("spinbutton", { name: "Giá mục tiêu (₫)" }), "15000000");
    await user.click(within(dialog).getByRole("button", { name: "Đặt cảnh báo" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("thấp hơn giá hiện tại");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("gửi giá hợp lệ rồi đóng hộp thoại và báo thành công", async () => {
    mockCreate.mockResolvedValue({ ok: true, data: { alertId: "al-1" } });
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByRole("spinbutton", { name: "Giá mục tiêu (₫)" }), "13000000");
    await user.click(within(dialog).getByRole("button", { name: "Đặt cảnh báo" }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ productId: "p-asus", targetPrice: 13_000_000 }));
    expect(await screen.findByRole("link", { name: "Xem cảnh báo giá" })).toHaveAttribute("href", "/account/price-alerts");
  });

  it("server từ chối thì hiện lý do và giữ hộp thoại mở", async () => {
    mockCreate.mockResolvedValue({ ok: false, message: "Bạn chỉ theo dõi được tối đa 20 sản phẩm" });
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByRole("spinbutton", { name: "Giá mục tiêu (₫)" }), "13000000");
    await user.click(within(dialog).getByRole("button", { name: "Đặt cảnh báo" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("tối đa 20 sản phẩm");
  });
});

describe("PriceAlertList", () => {
  it("chưa có cảnh báo thì mời khám phá sản phẩm", () => {
    renderWithProviders(<PriceAlertList alerts={[]} products={[]} />);
    expect(screen.getByText("Bạn chưa theo dõi giá sản phẩm nào.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Khám phá sản phẩm" })).toHaveAttribute("href", "/");
  });

  it("hiện tên (link tới sản phẩm), giá hiện tại và giá mục tiêu", () => {
    renderWithProviders(<PriceAlertList alerts={[alert()]} products={[asus]} />);
    expect(screen.getByRole("link", { name: "ASUS Vivobook 15" })).toHaveAttribute("href", "/products/asus-vivobook-15");
    expect(screen.getByText(/Giá hiện tại 14\.990\.000 ₫/)).toBeInTheDocument();
    expect(screen.getByText("13.000.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("Đang theo dõi")).toBeInTheDocument();
  });

  it("cảnh báo đã chạm mục tiêu có nhãn riêng", () => {
    renderWithProviders(<PriceAlertList alerts={[alert({ triggered_at: "2026-11-25T01:00:00.000Z" })]} products={[asus]} />);
    expect(screen.getByText("Đã chạm mục tiêu")).toBeInTheDocument();
  });

  it("ẩn cảnh báo của sản phẩm đã ngừng bán", () => {
    renderWithProviders(<PriceAlertList alerts={[alert({ product_id: "p-gone" })]} products={[asus]} />);
    expect(screen.getByText("Bạn chưa theo dõi giá sản phẩm nào.")).toBeInTheDocument();
  });

  it("không xoá khi người dùng chưa xác nhận", async () => {
    const user = setupUser();
    renderWithProviders(<PriceAlertList alerts={[alert()]} products={[asus]} />);
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    await user.click(await screen.findByRole("button", { name: "Giữ lại" }));
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("xác nhận thì xoá và làm mới trang", async () => {
    mockRemove.mockResolvedValue({ ok: true });
    const user = setupUser();
    renderWithProviders(<PriceAlertList alerts={[alert()]} products={[asus]} />);
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    const buttons = await screen.findAllByRole("button", { name: "Xoá" });
    await user.click(buttons[buttons.length - 1]!);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(mockRemove).toHaveBeenCalledWith({ alertId: "al-1" });
  });

  it("server từ chối xoá thì báo lỗi, không làm mới", async () => {
    mockRemove.mockResolvedValue({ ok: false, message: "Không tìm thấy cảnh báo giá" });
    const user = setupUser();
    renderWithProviders(<PriceAlertList alerts={[alert()]} products={[asus]} />);
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    const buttons = await screen.findAllByRole("button", { name: "Xoá" });
    await user.click(buttons[buttons.length - 1]!);
    expect(await screen.findByText("Không tìm thấy cảnh báo giá")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
