import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminShell } from "./AdminShell";
import { avatarInitial } from "./AdminHeader";

let currentPath = "/admin";
jest.mock("next/navigation", () => ({ usePathname: () => currentPath }));

// LogoutButton gọi Server Action — ở đây chỉ cần nút hiển thị được.
jest.mock("@/features/auth", () => ({
  LogoutButton: ({ children, className }: { children: ReactNode; className?: string }) => (
    <button type="button" className={className}>
      {children}
    </button>
  ),
}));

const user = { name: "Trần Minh An", email: "an.admin@example.com", avatarUrl: null };

/** antd (Menu/Sider) cập nhật state bất đồng bộ sau khi mount → chờ qua findBy để mọi update nằm trong act. */
async function renderShell(pathname: string) {
  currentPath = pathname;
  const view = render(
    <AdminShell user={user}>
      <p>Nội dung trang</p>
    </AdminShell>,
  );
  await screen.findByText("Nội dung trang");
  return view;
}

describe("AdminShell", () => {
  it("hiện tiêu đề theo trang đang mở", async () => {
    await renderShell("/admin/orders");
    expect(screen.getByRole("heading", { level: 1, name: "Quản lý đơn hàng" })).toBeInTheDocument();
  });

  it("trang Tổng quan có tiêu đề riêng", async () => {
    await renderShell("/admin");
    expect(screen.getByRole("heading", { level: 1, name: "Tổng quan" })).toBeInTheDocument();
  });

  it("menu có đủ 7 mục và trỏ đúng đường dẫn", async () => {
    await renderShell("/admin");
    const nav = screen.getByRole("navigation", { name: "Menu quản trị" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Tổng quan", "/admin"],
      ["Danh mục", "/admin/categories"],
      ["Sản phẩm", "/admin/products"],
      ["Đơn hàng", "/admin/orders"],
      ["Mã giảm giá", "/admin/coupons"],
      ["Thanh toán", "/admin/transactions"],
      ["Người dùng", "/admin/users"],
    ]);
  });

  it("đánh dấu mục đang chọn theo pathname (kể cả khi URL có thêm đoạn con)", async () => {
    await renderShell("/admin/coupons/extra");
    const nav = screen.getByRole("navigation", { name: "Menu quản trị" });
    const selected = within(nav)
      .getAllByRole("menuitem")
      .filter((item) => item.className.includes("ant-menu-item-selected"));
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("Mã giảm giá");
  });

  it("có link về trang bán hàng và render nội dung trang", async () => {
    await renderShell("/admin");
    expect(screen.getByRole("link", { name: /Về trang bán hàng/ })).toHaveAttribute("href", "/");
    expect(screen.getByText("Nội dung trang")).toBeInTheDocument();
  });

  it("bấm avatar mở menu tài khoản có tên, email và Đăng xuất", async () => {
    const u = userEvent.setup();
    await renderShell("/admin");
    await u.click(screen.getByRole("button", { name: "Tài khoản: Trần Minh An" }));
    expect(await screen.findByText("an.admin@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng xuất/ })).toBeInTheDocument();
  });
});

describe("avatarInitial", () => {
  it("lấy chữ đầu của tên gọi (từ cuối)", () => {
    expect(avatarInitial("Trần Minh An")).toBe("A");
  });

  it("tên một từ, có dấu, khoảng trắng thừa", () => {
    expect(avatarInitial("  ánh  ")).toBe("Á");
  });

  it("tên rỗng → ?", () => {
    expect(avatarInitial("   ")).toBe("?");
  });
});
