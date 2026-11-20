import { screen, waitFor, within } from "@testing-library/react";
import type { AdminOrderDetail } from "@/entities/order";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { OrderDetailDrawer } from "./OrderDetailDrawer";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams("status=paid&view=a1b2c3d4-0000-4000-8000-000000000001"),
}));
jest.mock("../actions", () => ({ updateOrderStatus: jest.fn() }));

function makeDetail(override: Partial<AdminOrderDetail> = {}): AdminOrderDetail {
  return {
    id: "a1b2c3d4-0000-4000-8000-000000000001",
    user: { id: "u-1", full_name: "Nguyễn Văn A", email: "vana@gmail.com", phone_number: "0912345678" },
    items: [
      { product: { id: "p-1", name: "Laptop UltraBook Pro 14 M3", price: 34_990_000 }, quantity: 1 },
      { product: { id: "p-2", name: "Điện thoại Galaxy S25 Ultra", price: 14_995_000 }, quantity: 2 },
    ],
    subtotal: 64_980_000,
    shipping_fee: 0,
    discount_amount: 0,
    total: 64_980_000,
    status: "paid",
    note: null,
    payment: { id: "pay-1", method: "payos", status: "success", amount: 64_980_000, paid_at: null },
    created_at: "2026-07-24T03:24:00.000Z",
    ...override,
  };
}

const section = (name: string) => screen.getByRole("region", { name });

describe("OrderDetailDrawer", () => {
  it("tiêu đề 'Đơn #<mã>', khách hàng và dòng sản phẩm (đơn giá × SL, thành tiền)", () => {
    renderWithAntd(<OrderDetailDrawer order={makeDetail()} />);
    expect(screen.getByText("Đơn #A1B2C3D4")).toBeInTheDocument();
    expect(within(section("Khách hàng")).getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(within(section("Khách hàng")).getByText("vana@gmail.com")).toBeInTheDocument();
    const items = within(section("Sản phẩm")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[1] as HTMLElement).getByText("14.995.000 ₫ × 2")).toBeInTheDocument();
    expect(within(items[1] as HTMLElement).getByText("29.990.000 ₫")).toBeInTheDocument();
  });

  it("thiếu trường người nhận (BE-4) → hiện —", () => {
    renderWithAntd(<OrderDetailDrawer order={makeDetail()} />);
    const recipient = section("Người nhận");
    expect(within(recipient).getByText("— · —")).toBeInTheDocument();
    expect(within(recipient).getByText("—")).toBeInTheDocument();
  });

  it("có trường người nhận thì hiện đủ", () => {
    renderWithAntd(
      <OrderDetailDrawer
        order={makeDetail({
          shipping_recipient_name: "Nguyễn Văn A",
          shipping_phone_number: "0912345678",
          shipping_full_address: "Số 12, Cầu Giấy, Hà Nội",
        })}
      />,
    );
    const recipient = section("Người nhận");
    expect(within(recipient).getByText("Nguyễn Văn A · 0912345678")).toBeInTheDocument();
    expect(within(recipient).getByText("Số 12, Cầu Giấy, Hà Nội")).toBeInTheDocument();
  });

  it("discount_amount = 0 → không có dòng Giảm giá; phí ship 0 → 'Miễn phí'; phương thức PayOS", () => {
    renderWithAntd(<OrderDetailDrawer order={makeDetail()} />);
    const summary = section("Tóm tắt thanh toán");
    expect(within(summary).queryByText("Giảm giá")).not.toBeInTheDocument();
    expect(within(summary).getByText("Miễn phí")).toBeInTheDocument();
    expect(within(summary).getByText("Chuyển khoản / PayOS")).toBeInTheDocument();
  });

  it("discount_amount > 0 → có dòng Giảm giá (số âm); phí ship > 0 hiện số tiền", () => {
    renderWithAntd(<OrderDetailDrawer order={makeDetail({ discount_amount: 5_000_000, shipping_fee: 30_000 })} />);
    const summary = section("Tóm tắt thanh toán");
    expect(within(summary).getByText("Giảm giá")).toBeInTheDocument();
    expect(within(summary).getByText("−5.000.000 ₫")).toBeInTheDocument();
    expect(within(summary).getByText("30.000 ₫")).toBeInTheDocument();
  });

  it("chưa có giao dịch → phương thức —; có ghi chú thì hiện", () => {
    renderWithAntd(<OrderDetailDrawer order={makeDetail({ status: "pending", payment: null, note: "Giao giờ hành chính" })} />);
    const summary = section("Tóm tắt thanh toán");
    expect(within(summary).getByText("—")).toBeInTheDocument();
    expect(within(summary).getByText("Ghi chú: Giao giờ hành chính")).toBeInTheDocument();
  });

  it("không có nút 'Xác nhận đã thu' (✅Q-O5)", () => {
    renderWithAntd(
      <OrderDetailDrawer
        order={makeDetail({ status: "pending", payment: { id: "p", method: "cod", status: "pending", amount: 1, paid_at: null } })}
      />,
    );
    expect(screen.queryByRole("button", { name: /Xác nhận đã thu/ })).not.toBeInTheDocument();
    expect(screen.getByText("Thanh toán khi nhận hàng (COD)")).toBeInTheDocument();
  });

  it("đơn không có dòng sản phẩm → 'Không có sản phẩm'", () => {
    renderWithAntd(<OrderDetailDrawer order={makeDetail({ status: "failed", items: [], payment: null })} />);
    expect(within(section("Sản phẩm")).getByText("Không có sản phẩm")).toBeInTheDocument();
  });

  it("đóng Drawer → bỏ ?view, giữ bộ lọc", async () => {
    const user = setupUser();
    renderWithAntd(<OrderDetailDrawer order={makeDetail()} />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(replace).toHaveBeenCalledWith("/admin/orders?status=paid", { scroll: false });
  });

  it("không tìm thấy đơn → báo lỗi và bỏ ?view, không render Drawer", async () => {
    renderWithAntd(<OrderDetailDrawer order={null} notFound />);
    expect(await screen.findByText("Không tìm thấy đơn hàng")).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/orders?status=paid", { scroll: false }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("order null, không có notFound → không render gì", () => {
    renderWithAntd(<OrderDetailDrawer order={null} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
