import { render, screen } from "@testing-library/react";
import { SearchBar, SearchBarView } from "./SearchBar";

let currentSearch = "";
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentSearch),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

beforeEach(() => {
  currentSearch = "";
});

describe("SearchBar", () => {
  it("điền sẵn từ khoá đang có trên URL", () => {
    currentSearch = "q=laptop+asus";
    render(<SearchBar />);
    expect(screen.getByRole("searchbox", { name: "Tìm sản phẩm" })).toHaveValue("laptop asus");
  });

  it("không có từ khoá thì ô trống", () => {
    render(<SearchBar />);
    expect(screen.getByRole("searchbox", { name: "Tìm sản phẩm" })).toHaveValue("");
  });
});

describe("SearchBarView", () => {
  it("là form tìm kiếm gửi tới /search với tham số q", () => {
    render(<SearchBarView />);
    const input = screen.getByRole("searchbox", { name: "Tìm sản phẩm" });
    expect(input).toHaveAttribute("name", "q");
    expect(screen.getByRole("search")).toHaveAttribute("action", "/search");
  });

  it("bản compact dùng placeholder mặc định và không có nút gửi", () => {
    render(<SearchBarView />);
    expect(screen.getByPlaceholderText("Tìm laptop, linh kiện, phụ kiện…")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("bản hero có placeholder riêng và nút 'Tìm sản phẩm'", () => {
    render(<SearchBarView variant="hero" />);
    expect(screen.getByPlaceholderText("Bạn cần tìm sản phẩm gì?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tìm sản phẩm" })).toHaveAttribute("type", "submit");
  });

  it("cho phép đổi placeholder", () => {
    render(<SearchBarView placeholder="Gõ để tìm" />);
    expect(screen.getByPlaceholderText("Gõ để tìm")).toBeInTheDocument();
  });

  it("nhận giá trị mặc định", () => {
    render(<SearchBarView defaultValue="chuột" />);
    expect(screen.getByRole("searchbox")).toHaveValue("chuột");
  });
});
