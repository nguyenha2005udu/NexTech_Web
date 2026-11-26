import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu, type SessionResponse } from "./UserMenu";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

// LogoutButton gọi Server Action — ở đây chỉ cần nút hiển thị được.
jest.mock("@/features/auth", () => ({
  LogoutButton: ({ children, className }: { children: ReactNode; className?: string }) => (
    <button type="button" className={className}>
      {children}
    </button>
  ),
}));

function mockSession(user: SessionResponse["user"]) {
  const body: SessionResponse = { user };
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(body) })) as unknown as typeof fetch;
}

describe("UserMenu", () => {
  it("khách thấy link đăng nhập", async () => {
    mockSession(null);
    render(<UserMenu guestLabel="Tài khoản" linkClassName="x" />);
    expect(await screen.findByRole("link", { name: "Tài khoản" })).toHaveAttribute("href", "/login");
  });

  it("rê chuột vào tên thì mở menu có các mục tài khoản và nút đăng xuất", async () => {
    mockSession({ full_name: "Nguyễn Văn An", role: "user" });
    const user = userEvent.setup();
    render(<UserMenu guestLabel="Tài khoản" linkClassName="x" />);

    const trigger = await screen.findByRole("button", { name: /Nguyễn Văn An/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.hover(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Thông tin cá nhân" })).toHaveAttribute("href", "/account/profile");
    expect(screen.getByRole("link", { name: "Đơn hàng của tôi" })).toHaveAttribute("href", "/account/orders");
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Trang quản trị" })).not.toBeInTheDocument();

    await user.unhover(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("admin có thêm link Trang quản trị", async () => {
    mockSession({ full_name: "Trần Minh", role: "admin" });
    const user = userEvent.setup();
    render(<UserMenu guestLabel="Tài khoản" linkClassName="x" />);

    await user.click(await screen.findByRole("button", { name: /Trần Minh/ }));
    expect(screen.getByRole("link", { name: "Trang quản trị" })).toHaveAttribute("href", "/admin");
  });

  it("bấm Escape thì đóng menu và trả focus về nút", async () => {
    mockSession({ full_name: "Lê Hoa", role: "user" });
    const user = userEvent.setup();
    render(<UserMenu guestLabel="Tài khoản" linkClassName="x" />);

    const trigger = await screen.findByRole("button", { name: /Lê Hoa/ });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("đang rê chuột mà bấm vào tên thì menu vẫn mở; bấm ra ngoài thì đóng", async () => {
    mockSession({ full_name: "Lê Hoa", role: "user" });
    const user = userEvent.setup();
    render(
      <>
        <UserMenu guestLabel="Tài khoản" linkClassName="x" />
        <p>Bên ngoài</p>
      </>,
    );

    const trigger = await screen.findByRole("button", { name: /Lê Hoa/ });
    await user.hover(trigger);
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByText("Bên ngoài"));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("dùng bàn phím: Enter bật/tắt menu", async () => {
    mockSession({ full_name: "Lê Hoa", role: "user" });
    const user = userEvent.setup();
    render(<UserMenu guestLabel="Tài khoản" linkClassName="x" />);

    const trigger = await screen.findByRole("button", { name: /Lê Hoa/ });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("bấm một mục trong menu thì menu đóng lại", async () => {
    mockSession({ full_name: "Lê Hoa", role: "user" });
    const user = userEvent.setup();
    render(<UserMenu guestLabel="Tài khoản" linkClassName="x" />);

    const trigger = await screen.findByRole("button", { name: /Lê Hoa/ });
    await user.click(trigger);
    await user.click(screen.getByRole("link", { name: "Đơn hàng của tôi" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("avatar hiện chữ cái đầu của tên", async () => {
    mockSession({ full_name: "Nguyễn Văn an", role: "user" });
    render(<UserMenu guestLabel="Tài khoản" linkClassName="x" />);
    await screen.findByRole("button", { name: /Nguyễn Văn an/ });
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
  });
});
