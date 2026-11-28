import { render, screen, within } from "@testing-library/react";
import { makeFilters } from "@/lib/test-utils";
import { ResultCount } from "./ResultCount";
import { SearchPager } from "./SearchPager";

describe("SearchPager", () => {
  it("chỉ 1 trang thì không hiện gì", () => {
    const { container } = render(<SearchPager filters={makeFilters()} page={1} totalPages={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("trang 1: 'Trước' bị vô hiệu, 'Sau' trỏ tới trang 2, trang hiện tại không phải link", () => {
    render(<SearchPager filters={makeFilters()} page={1} totalPages={7} />);
    const nav = screen.getByRole("navigation", { name: "Phân trang kết quả" });
    expect(within(nav).queryByRole("link", { name: /Trước/ })).not.toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /Sau/ })).toHaveAttribute("href", "/search?page=2");
    expect(within(nav).getByText("1")).toHaveAttribute("aria-current", "page");
    expect(within(nav).queryByRole("link", { name: "Trang 1" })).not.toBeInTheDocument();
  });

  it("trang giữa: có cả Trước, Sau và số trang lân cận; trang 1 là link về /search (không ?page=)", () => {
    render(<SearchPager filters={makeFilters()} page={4} totalPages={20} />);
    const nav = screen.getByRole("navigation", { name: "Phân trang kết quả" });
    expect(within(nav).getByRole("link", { name: /Trước/ })).toHaveAttribute("href", "/search?page=3");
    expect(within(nav).getByRole("link", { name: /Sau/ })).toHaveAttribute("href", "/search?page=5");
    expect(within(nav).getByRole("link", { name: "Trang 1" })).toHaveAttribute("href", "/search");
    expect(within(nav).getByRole("link", { name: "Trang 20" })).toHaveAttribute("href", "/search?page=20");
  });

  it("trang cuối: 'Sau' bị vô hiệu", () => {
    render(<SearchPager filters={makeFilters()} page={7} totalPages={7} />);
    expect(screen.queryByRole("link", { name: /Sau/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Trước/ })).toHaveAttribute("href", "/search?page=6");
  });

  it("giữ nguyên từ khoá, hãng, giá và sắp xếp trong mọi link", () => {
    const filters = makeFilters({ q: "laptop", brands: ["ASUS", "Dell"], min: 100, sort: "price-desc" });
    render(<SearchPager filters={filters} page={2} totalPages={5} />);
    const next = new URL(screen.getByRole("link", { name: /Sau/ }).getAttribute("href")!, "http://x").searchParams;
    expect(next.get("q")).toBe("laptop");
    expect(next.get("brand")).toBe("ASUS,Dell");
    expect(next.get("min")).toBe("100");
    expect(next.get("sort")).toBe("price-desc");
    expect(next.get("page")).toBe("3");
  });
});

describe("ResultCount", () => {
  it("không phân trang: 'Hiển thị 12 / 12 sản phẩm'", () => {
    render(<ResultCount shown={12} total={12} />);
    expect(screen.getByText("Hiển thị 12 / 12 sản phẩm")).toBeInTheDocument();
  });

  it("có phân trang: hiện khoảng thứ tự của trang", () => {
    render(<ResultCount shown={24} total={161} from={25} />);
    expect(screen.getByText("Hiển thị 25–48 / 161 sản phẩm")).toBeInTheDocument();
  });

  it("trang cuối chỉ có phần dư", () => {
    render(<ResultCount shown={17} total={161} from={145} />);
    expect(screen.getByText("Hiển thị 145–161 / 161 sản phẩm")).toBeInTheDocument();
  });
});
