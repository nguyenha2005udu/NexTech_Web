import { screen } from "@testing-library/react";
import { makeCartItem, renderWithProviders } from "@/lib/test-utils";
import { CartBadge } from "./CartBadge";

describe("CartBadge", () => {
  it("không hiện gì khi giỏ chưa nạp xong (khớp HTML server)", () => {
    const { container } = renderWithProviders(<CartBadge />, {
      preloadedState: { cart: { items: [makeCartItem({ quantity: 2 })], hydrated: false } },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("không hiện gì khi giỏ rỗng", () => {
    const { container } = renderWithProviders(<CartBadge />, {
      preloadedState: { cart: { items: [], hydrated: true } },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("hiện tổng số lượng và chữ cho trình đọc màn hình", () => {
    renderWithProviders(<CartBadge />, {
      preloadedState: { cart: { items: [makeCartItem({ quantity: 2 }), makeCartItem({ quantity: 1 })], hydrated: true } },
    });
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("(3 sản phẩm)")).toBeInTheDocument();
  });

  it("rút gọn thành 99+ khi quá 99", () => {
    const items = Array.from({ length: 11 }, () => makeCartItem({ quantity: 10 }));
    renderWithProviders(<CartBadge />, { preloadedState: { cart: { items, hydrated: true } } });
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
