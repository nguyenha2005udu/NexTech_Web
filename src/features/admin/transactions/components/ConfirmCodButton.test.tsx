import { screen, waitFor } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { confirmCodPayment } from "../actions";
import { ConfirmCodButton } from "./ConfirmCodButton";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace: jest.fn() }) }));
jest.mock("../actions", () => ({ confirmCodPayment: jest.fn() }));

const mockConfirm = jest.mocked(confirmCodPayment);
const payment = {
  id: "e5f6a7b8-0000-4000-8000-000000000002",
  order_id: "c1d2e3f4-0000-4000-8000-000000000009",
  amount: 7_990_000,
};

async function openDialog(user: ReturnType<typeof setupUser>) {
  await user.click(screen.getByRole("button", { name: "Xác nhận đã thu PAY-E5F6A7B8" }));
  // antd in tiêu đề hai lần (một bản ẩn cho trình đọc màn hình) → chờ nút OK thay vì tiêu đề
  return screen.findByRole("button", { name: "Đã thu tiền" });
}

describe("ConfirmCodButton", () => {
  it("bấm → hiện hộp xác nhận có mã GD, mã đơn, số tiền", async () => {
    const user = setupUser();
    renderWithAntd(<ConfirmCodButton payment={payment} />);
    expect(await openDialog(user)).toBeInTheDocument();
    expect(screen.getAllByText("Xác nhận đã thu tiền?").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Giao dịch PAY-E5F6A7B8 · Đơn #C1D2E3F4 · 7.990.000 ₫. Thao tác này đổi giao dịch sang Thành công.",
      ),
    ).toBeInTheDocument();
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("bấm Huỷ → không gọi action", async () => {
    const user = setupUser();
    renderWithAntd(<ConfirmCodButton payment={payment} />);
    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Huỷ" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Đã thu tiền" })).not.toBeInTheDocument());
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("bấm 'Đã thu tiền' → gọi action đúng 1 lần, báo thành công", async () => {
    const user = setupUser();
    mockConfirm.mockResolvedValueOnce({ ok: true });
    renderWithAntd(<ConfirmCodButton payment={payment} />);
    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Đã thu tiền" }));
    expect(await screen.findByText("Đã xác nhận thu tiền")).toBeInTheDocument();
    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockConfirm).toHaveBeenCalledWith({ id: payment.id });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("lỗi NT-PAY-1009 → hiện nguyên câu backend và tải lại trang", async () => {
    const user = setupUser();
    const message = 'Giao dịch đang ở trạng thái "success", không thể xác nhận thu tiền';
    mockConfirm.mockResolvedValueOnce({ ok: false, message });
    renderWithAntd(<ConfirmCodButton payment={payment} />);
    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Đã thu tiền" }));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("variant block → nút primary chiếm cả hàng (dùng ở chân Drawer)", () => {
    renderWithAntd(<ConfirmCodButton payment={payment} variant="block" />);
    const button = screen.getByRole("button", { name: "Xác nhận đã thu PAY-E5F6A7B8" });
    expect(button).toHaveClass("ant-btn-primary");
    expect(button).toHaveClass("ant-btn-block");
  });
});
