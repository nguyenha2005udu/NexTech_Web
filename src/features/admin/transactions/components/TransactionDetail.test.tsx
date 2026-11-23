import { screen, waitFor } from "@testing-library/react";
import type { AdminPaymentDetail } from "@/entities/transaction";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { TransactionDetail } from "./TransactionDetail";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: jest.fn() }),
  usePathname: () => "/admin/transactions",
  useSearchParams: () => new URLSearchParams("method=payos&view=a1b2c3d4-0000-4000-8000-000000000001"),
}));
jest.mock("../actions", () => ({ confirmCodPayment: jest.fn() }));

function makeDetail(override: Partial<AdminPaymentDetail> = {}): AdminPaymentDetail {
  return {
    id: "a1b2c3d4-0000-4000-8000-000000000001",
    order_id: "e5f6a7b8-0000-4000-8000-000000000001",
    method: "payos",
    amount: 16_990_000,
    status: "refunded",
    paid_at: "2026-07-21T01:20:00.000Z",
    transaction_id: "987654321",
    currency: "VND",
    ...override,
  };
}

describe("TransactionDetail", () => {
  it("tiêu đề 'Giao dịch PAY-…' và đủ các dòng của mockup", () => {
    renderWithAntd(<TransactionDetail payment={makeDetail()} />);
    expect(screen.getByText("Giao dịch PAY-A1B2C3D4")).toBeInTheDocument();
    expect(screen.getByText("Mã giao dịch")).toBeInTheDocument();
    expect(screen.getByText("PayOS")).toBeInTheDocument();
    expect(screen.getByText("16.990.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("Đã hoàn tiền")).toBeInTheDocument();
    expect(screen.getByText("21/07/2026 08:20")).toBeInTheDocument();
  });

  it("link 'Đơn liên kết' trỏ /admin/orders?view=<order_id>", () => {
    renderWithAntd(<TransactionDetail payment={makeDetail()} />);
    expect(screen.getByRole("link", { name: /Đơn #E5F6A7B8/ })).toHaveAttribute(
      "href",
      "/admin/orders?view=e5f6a7b8-0000-4000-8000-000000000001",
    );
  });

  it("PayOS có transaction_id → hiện 'Mã giao dịch PayOS'; COD thì không", () => {
    const { unmount } = renderWithAntd(<TransactionDetail payment={makeDetail()} />);
    expect(screen.getByText("Mã giao dịch PayOS")).toBeInTheDocument();
    expect(screen.getByText("987654321")).toBeInTheDocument();
    unmount();
    renderWithAntd(<TransactionDetail payment={makeDetail({ method: "cod", transaction_id: null, status: "success" })} />);
    expect(screen.queryByText("Mã giao dịch PayOS")).not.toBeInTheDocument();
  });

  it("COD đang chờ → có nút 'Xác nhận đã thu' ở chân; paid_at null → —", () => {
    renderWithAntd(
      <TransactionDetail payment={makeDetail({ method: "cod", status: "pending", paid_at: null, transaction_id: null })} />,
    );
    expect(screen.getByRole("button", { name: "Xác nhận đã thu PAY-A1B2C3D4" })).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("giao dịch đã thành công → không có nút xác nhận", () => {
    renderWithAntd(<TransactionDetail payment={makeDetail({ status: "success" })} />);
    expect(screen.queryByRole("button", { name: /Xác nhận đã thu/ })).not.toBeInTheDocument();
  });

  it("đóng Drawer → bỏ ?view, giữ bộ lọc", async () => {
    const user = setupUser();
    renderWithAntd(<TransactionDetail payment={makeDetail()} />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(replace).toHaveBeenCalledWith("/admin/transactions?method=payos", { scroll: false });
  });

  it("không có giao dịch → không render gì", () => {
    renderWithAntd(<TransactionDetail payment={null} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("notFound → báo 'Không tìm thấy giao dịch' rồi bỏ ?view", async () => {
    renderWithAntd(<TransactionDetail payment={null} notFound />);
    expect(await screen.findByText("Không tìm thấy giao dịch")).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/transactions?method=payos", { scroll: false }));
  });
});
