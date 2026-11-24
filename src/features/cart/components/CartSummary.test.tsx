import { screen } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { CartSummary } from "./CartSummary";

describe("CartSummary", () => {
  it("hiện tạm tính và tổng cộng của các sản phẩm được chọn", () => {
    renderWithAntd(<CartSummary subtotal={14_990_000} selectedCount={1} onCheckout={jest.fn()} />);
    expect(screen.getByRole("heading", { name: "Tóm tắt giỏ hàng" })).toBeInTheDocument();
    expect(screen.getAllByText("14.990.000 ₫")).toHaveLength(2);
  });

  it("gọi onCheckout khi bấm 'Tiến hành đặt hàng'", async () => {
    const onCheckout = jest.fn();
    const user = setupUser();
    renderWithAntd(<CartSummary subtotal={1} selectedCount={1} onCheckout={onCheckout} />);
    await user.click(screen.getByRole("button", { name: /Tiến hành đặt hàng/ }));
    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("khoá nút đặt hàng khi chưa chọn sản phẩm nào", () => {
    renderWithAntd(<CartSummary subtotal={0} selectedCount={0} onCheckout={jest.fn()} />);
    expect(screen.getByRole("button", { name: /Tiến hành đặt hàng/ })).toBeDisabled();
  });
});
