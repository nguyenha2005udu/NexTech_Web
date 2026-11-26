import { screen } from "@testing-library/react";
import type { MyOrderSummary } from "@/entities/order";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { retryPayment } from "../actions";
import { PaymentResult } from "./PaymentResult";

jest.mock("../actions", () => ({ retryPayment: jest.fn() }));
const mockRetry = jest.mocked(retryPayment);

const ID = "a1b2c3d4-0000-4000-8000-000000000001";
const order = (override: Partial<MyOrderSummary>): MyOrderSummary => ({
  id: ID,
  status: "pending",
  total: 14_820_000,
  payment_method: "cod",
  payment_status: null,
  ...override,
});

describe("PaymentResult", () => {
  it("COD: 'Đã đặt hàng' với số tiền trả khi nhận (03.08)", () => {
    renderWithAntd(<PaymentResult order={order({})} />);
    expect(screen.getByRole("heading", { level: 1, name: "Đã đặt hàng" })).toBeInTheDocument();
    expect(screen.getByText("Bạn thanh toán 14.820.000 ₫ khi nhận đơn #A1B2C3D4.")).toBeInTheDocument();
    expect(screen.getByText("COD")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem đơn hàng/ })).toHaveAttribute("href", `/account/orders/${ID}`);
    expect(screen.getByRole("link", { name: "Tiếp tục mua sắm" })).toHaveAttribute("href", "/");
  });

  it("PayOS thành công: 'Thanh toán thành công' (03.09)", () => {
    renderWithAntd(<PaymentResult order={order({ payment_method: "payos", status: "paid", payment_status: "success" })} />);
    expect(screen.getByRole("heading", { level: 1, name: "Thanh toán thành công" })).toBeInTheDocument();
    expect(screen.getByText("PayOS / VietQR")).toBeInTheDocument();
  });

  it("PayOS chưa xác nhận: 'Đang xác nhận thanh toán' (03.10)", () => {
    renderWithAntd(<PaymentResult order={order({ payment_method: "payos", status: "processing", payment_status: "pending" })} />);
    expect(screen.getByRole("heading", { level: 1, name: "Đang xác nhận thanh toán" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
  });

  it("thất bại: 'Thanh toán chưa hoàn tất' có nút Thử lại thay cho Tiếp tục mua sắm (03.11)", () => {
    renderWithAntd(<PaymentResult order={order({ payment_method: "payos", status: "failed", payment_status: "failed" })} />);
    expect(screen.getByRole("heading", { level: 1, name: "Thanh toán chưa hoàn tất" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tiếp tục mua sắm" })).not.toBeInTheDocument();
  });

  it("bấm Thử lại khi chưa tạo được link mới thì báo lỗi, không rời trang", async () => {
    mockRetry.mockResolvedValue({ ok: false, message: "Chưa tạo được link thanh toán mới. Vui lòng thử lại sau." });
    const user = setupUser();
    renderWithAntd(<PaymentResult order={order({ payment_method: "payos", status: "failed", payment_status: "failed" })} />);
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mockRetry).toHaveBeenCalledWith({ orderId: ID });
    expect(await screen.findByText("Chưa tạo được link thanh toán mới. Vui lòng thử lại sau.")).toBeInTheDocument();
  });
});
