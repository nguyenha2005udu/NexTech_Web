import { screen, waitFor } from "@testing-library/react";
import type { MyOrderDetail } from "@/entities/order";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { cancelOrder } from "../actions";
import { CancelOrderButton } from "./CancelOrderButton";
import { OrderDetail } from "./OrderDetail";
import { OrderList } from "./OrderList";
import { OrderStatusFilter } from "./OrderStatusFilter";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
jest.mock("../actions", () => ({ cancelOrder: jest.fn() }));
const mockCancel = jest.mocked(cancelOrder);

const ID = "a1b2c3d4-0000-4000-8000-000000000001";
const makeOrder = (override: Partial<MyOrderDetail> = {}): MyOrderDetail => ({
  id: ID,
  status: "pending",
  total: 14_820_000,
  payment_method: "cod",
  payment_status: null,
  created_at: "2026-11-24T03:00:00.000Z",
  items: [
    { product_id: "p-1", name: "ASUS Vivobook 15", quantity: 1, unit_price: 14_990_000 },
    { product_id: "p-2", name: "Chuột Logitech", quantity: 2, unit_price: 500_000 },
  ],
  shipping: { recipient_name: "Minh Anh", phone_number: "090 000 0000", full_address: "123 Nguyễn Văn Cừ" },
  subtotal: 14_990_000,
  shipping_fee: 30_000,
  discount_amount: 200_000,
  discount_code: "NEX200",
  ...override,
});

afterEach(() => jest.clearAllMocks());

describe("OrderStatusFilter", () => {
  it("'Tất cả' là tab đang chọn khi không lọc", () => {
    renderWithAntd(<OrderStatusFilter active={undefined} />);
    expect(screen.getByRole("link", { name: "Tất cả" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Đang giao" })).toHaveAttribute("href", "/account/orders?status=shipped");
  });

  it("đánh dấu tab trạng thái đang lọc", () => {
    renderWithAntd(<OrderStatusFilter active="paid" />);
    expect(screen.getByRole("link", { name: "Đã thanh toán" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Tất cả" })).not.toHaveAttribute("aria-current");
  });
});

describe("OrderList", () => {
  it("hiện mã đơn, tên sản phẩm đầu, số sản phẩm còn lại, tổng tiền và trạng thái", () => {
    renderWithAntd(<OrderList orders={[makeOrder()]} filtered={false} />);
    expect(screen.getByText("#A1B2C3D4")).toBeInTheDocument();
    expect(screen.getByText(/ASUS Vivobook 15 và 1 sản phẩm khác/)).toBeInTheDocument();
    expect(screen.getByText("14.820.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("Chờ xử lý")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem chi tiết" })).toHaveAttribute("href", `/account/orders/${ID}`);
  });

  it("chưa có đơn nào thì mời mua sắm", () => {
    renderWithAntd(<OrderList orders={[]} filtered={false} />);
    expect(screen.getByText("Bạn chưa có đơn hàng nào.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tiếp tục mua sắm" })).toHaveAttribute("href", "/");
  });

  it("lọc không ra đơn thì báo theo trạng thái", () => {
    renderWithAntd(<OrderList orders={[]} filtered />);
    expect(screen.getByText("Không có đơn hàng nào ở trạng thái này.")).toBeInTheDocument();
  });
});

describe("OrderDetail", () => {
  it("hiện sản phẩm, địa chỉ và bảng tiền có giảm giá", () => {
    renderWithAntd(<OrderDetail order={makeOrder()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Đơn hàng #A1B2C3D4" })).toBeInTheDocument();
    expect(screen.getByText("ASUS Vivobook 15")).toBeInTheDocument();
    expect(screen.getByText("1.000.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("Minh Anh · 090 000 0000")).toBeInTheDocument();
    expect(screen.getByText("Giảm giá (NEX200)")).toBeInTheDocument();
    expect(screen.getByText("-200.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("Phương thức: COD")).toBeInTheDocument();
  });

  it("ẩn dòng giảm giá khi không dùng mã", () => {
    renderWithAntd(<OrderDetail order={makeOrder({ discount_amount: 0, discount_code: null })} />);
    expect(screen.queryByText(/Giảm giá/)).not.toBeInTheDocument();
  });

  it("đơn chờ xử lý có nút Huỷ đơn", () => {
    renderWithAntd(<OrderDetail order={makeOrder()} />);
    expect(screen.getByRole("button", { name: "Huỷ đơn" })).toBeInTheDocument();
  });

  it.each(["shipped", "paid", "cancelled"] as const)("đơn %s không có nút Huỷ đơn", (status) => {
    renderWithAntd(<OrderDetail order={makeOrder({ status })} />);
    expect(screen.queryByRole("button", { name: "Huỷ đơn" })).not.toBeInTheDocument();
  });
});

describe("CancelOrderButton", () => {
  it("không gọi server khi người dùng chưa xác nhận", async () => {
    const user = setupUser();
    renderWithAntd(<CancelOrderButton orderId={ID} />);
    await user.click(screen.getByRole("button", { name: "Huỷ đơn" }));
    await user.click(await screen.findByRole("button", { name: "Giữ đơn" }));
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("xác nhận thì huỷ đơn và làm mới trang", async () => {
    mockCancel.mockResolvedValue({ ok: true, data: { orderId: ID } });
    const user = setupUser();
    renderWithAntd(<CancelOrderButton orderId={ID} />);
    await user.click(screen.getByRole("button", { name: "Huỷ đơn" }));
    const buttons = await screen.findAllByRole("button", { name: "Huỷ đơn" });
    await user.click(buttons[buttons.length - 1]!);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(mockCancel).toHaveBeenCalledWith({ orderId: ID });
  });

  it("server từ chối thì báo lỗi, không làm mới", async () => {
    mockCancel.mockResolvedValue({ ok: false, message: "Đơn hàng này không còn huỷ được" });
    const user = setupUser();
    renderWithAntd(<CancelOrderButton orderId={ID} />);
    await user.click(screen.getByRole("button", { name: "Huỷ đơn" }));
    const buttons = await screen.findAllByRole("button", { name: "Huỷ đơn" });
    await user.click(buttons[buttons.length - 1]!);
    expect(await screen.findByText("Đơn hàng này không còn huỷ được")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
