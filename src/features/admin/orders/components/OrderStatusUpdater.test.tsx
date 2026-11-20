import { screen, waitFor } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { updateOrderStatus } from "../actions";
import { OrderStatusUpdater } from "./OrderStatusUpdater";

jest.mock("../actions", () => ({ updateOrderStatus: jest.fn() }));

const mockUpdate = jest.mocked(updateOrderStatus);
const ID = "aaaaaaaa-0000-4000-8000-000000000002";

async function choose(user: ReturnType<typeof setupUser>, label: string) {
  await user.click(screen.getByRole("combobox", { name: "Cập nhật trạng thái" }));
  await user.click(await screen.findByTitle(label));
}

describe("OrderStatusUpdater", () => {
  it("chưa đổi → nút Lưu bị khoá, không có cảnh báo", () => {
    renderWithAntd(<OrderStatusUpdater orderId={ID} status="paid" paymentMethod="payos" />);
    expect(screen.getByRole("button", { name: "Lưu trạng thái" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("chọn 'Đang giao' → hiện đúng câu cảnh báo của mockup, mở khoá nút", async () => {
    const user = setupUser();
    renderWithAntd(<OrderStatusUpdater orderId={ID} status="paid" paymentMethod="payos" />);
    await choose(user, "Đang giao");
    expect(
      await screen.findByText('Đổi trạng thái sang "Đang giao"? Khách hàng sẽ nhận được thông báo.'),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu trạng thái" })).toBeEnabled();
  });

  it("đơn PayOS chờ thanh toán chỉ cho chọn 'Đã huỷ'", async () => {
    const user = setupUser();
    renderWithAntd(<OrderStatusUpdater orderId={ID} status="pending" paymentMethod="payos" />);
    await user.click(screen.getByRole("combobox", { name: "Cập nhật trạng thái" }));
    expect(await screen.findByTitle("Đã huỷ")).toBeInTheDocument();
    expect(screen.queryByTitle("Đang giao")).not.toBeInTheDocument();
  });

  it("trạng thái cuối → không có Select, hiện chữ 'Đơn đã ở trạng thái cuối'", () => {
    renderWithAntd(<OrderStatusUpdater orderId={ID} status="shipped" paymentMethod="cod" />);
    expect(screen.getByText("Đơn đã ở trạng thái cuối")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu trạng thái" })).not.toBeInTheDocument();
  });

  it("lưu thành công → gọi action đúng tham số, báo thành công", async () => {
    const user = setupUser();
    mockUpdate.mockResolvedValueOnce({ ok: true });
    renderWithAntd(<OrderStatusUpdater orderId={ID} status="paid" paymentMethod="payos" />);
    await choose(user, "Đang giao");
    await user.click(screen.getByRole("button", { name: "Lưu trạng thái" }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ id: ID, status: "shipped" }));
    expect(await screen.findByText("Đã cập nhật trạng thái")).toBeInTheDocument();
  });

  it("lỗi NT-ORD-1007 → hiện nguyên câu backend", async () => {
    const user = setupUser();
    const message = 'Không thể chuyển đơn từ "paid" sang "cancelled"';
    mockUpdate.mockResolvedValueOnce({ ok: false, message });
    renderWithAntd(<OrderStatusUpdater orderId={ID} status="paid" paymentMethod="payos" />);
    await choose(user, "Đã huỷ");
    expect(screen.getByText("Đơn đã thanh toán — cần hoàn tiền thủ công cho khách.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lưu trạng thái" }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});
