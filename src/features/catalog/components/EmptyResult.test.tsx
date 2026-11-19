import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyResult } from "./EmptyResult";

const replace = jest.fn();
let currentSearch = "";

jest.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

describe("EmptyResult", () => {
  it("hiện nội dung mặc định của trang tìm kiếm", () => {
    currentSearch = "q=iphone";
    render(<EmptyResult />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Thử từ khóa khác" })).toBeInTheDocument();
  });

  it("ẩn nút 'Xóa bộ lọc' khi không có điều kiện lọc", () => {
    currentSearch = "q=iphone&sort=rating";
    render(<EmptyResult />);
    expect(screen.queryByRole("button", { name: "Xóa bộ lọc" })).not.toBeInTheDocument();
  });

  it("bấm 'Xóa bộ lọc' thì bỏ điều kiện lọc nhưng giữ từ khoá", async () => {
    currentSearch = "q=iphone&brand=ASUS";
    const user = userEvent.setup();
    render(<EmptyResult />);

    await user.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));

    expect(replace).toHaveBeenCalledWith("/search?q=iphone", { scroll: false });
  });

  it("cho phép đổi tiêu đề và mô tả (danh mục chưa có sản phẩm)", () => {
    currentSearch = "";
    render(<EmptyResult title="Danh mục đang cập nhật" text="Sắp có hàng." />);
    expect(screen.getByRole("heading", { name: "Danh mục đang cập nhật" })).toBeInTheDocument();
    expect(screen.getByText("Sắp có hàng.")).toBeInTheDocument();
  });
});
