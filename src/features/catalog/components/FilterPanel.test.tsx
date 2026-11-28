import { screen } from "@testing-library/react";
import type { FilterFacets } from "@/entities/product";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { FilterPanel } from "./FilterPanel";

const replace = jest.fn();
let currentSearch = "";
jest.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

const facets: FilterFacets = { brands: ["ASUS", "Acer"], rams: ["8 GB", "16 GB"], cpus: ["Intel Core i5"] };

/** Query của lần `router.replace` gần nhất, dạng object để so sánh không phụ thuộc thứ tự tham số. */
function lastQuery() {
  const url = String(replace.mock.calls.at(-1)?.[0]);
  return Object.fromEntries(new URL(url, "http://x").searchParams);
}

beforeEach(() => {
  currentSearch = "";
});
afterEach(() => jest.clearAllMocks());

describe("FilterPanel", () => {
  it("hiện các nhóm thương hiệu, RAM, bộ xử lý từ facets", () => {
    renderWithAntd(<FilterPanel facets={facets} />);
    expect(screen.getByRole("group", { name: "Thương hiệu" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "RAM" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Bộ xử lý" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Acer" })).toBeInTheDocument();
  });

  it("ẩn nhóm không có lựa chọn nào", () => {
    renderWithAntd(<FilterPanel facets={{ brands: ["ASUS"], rams: [], cpus: [] }} />);
    expect(screen.queryByRole("group", { name: "RAM" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Bộ xử lý" })).not.toBeInTheDocument();
  });

  it("đánh dấu sẵn các giá trị đang có trên URL", () => {
    currentSearch = "brand=ASUS&ram=16+GB";
    renderWithAntd(<FilterPanel facets={facets} />);
    expect(screen.getByRole("checkbox", { name: "ASUS" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "16 GB" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Acer" })).not.toBeChecked();
  });

  it("tick thương hiệu thì cập nhật URL", async () => {
    const user = setupUser();
    renderWithAntd(<FilterPanel facets={facets} />);
    await user.click(screen.getByRole("checkbox", { name: "Acer" }));
    expect(lastQuery()).toEqual({ brand: "Acer" });
  });

  it("bỏ tick thì bỏ giá trị đó khỏi URL, giữ các giá trị khác", async () => {
    currentSearch = "brand=ASUS,Acer";
    const user = setupUser();
    renderWithAntd(<FilterPanel facets={facets} />);
    await user.click(screen.getByRole("checkbox", { name: "ASUS" }));
    expect(lastQuery()).toEqual({ brand: "Acer" });
  });

  it("nhập khoảng giá rồi bấm Áp dụng thì ghi min/max lên URL", async () => {
    const user = setupUser();
    renderWithAntd(<FilterPanel facets={facets} />);
    await user.type(screen.getByRole("spinbutton", { name: "Giá từ" }), "10000000");
    await user.type(screen.getByRole("spinbutton", { name: "Giá đến" }), "20000000");
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(lastQuery()).toEqual({ min: "10000000", max: "20000000" });
  });

  it("chưa nhập giá mà bấm Áp dụng thì không có min/max, vẫn giữ lọc khác", async () => {
    currentSearch = "brand=ASUS";
    const user = setupUser();
    renderWithAntd(<FilterPanel facets={facets} />);
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(lastQuery()).toEqual({ brand: "ASUS" });
  });

  it("hiện sẵn khoảng giá đang áp dụng trong ô nhập", () => {
    currentSearch = "min=5000000&max=15000000";
    renderWithAntd(<FilterPanel facets={facets} />);
    expect(screen.getByRole("spinbutton", { name: "Giá từ" })).toHaveValue("5.000.000");
    expect(screen.getByRole("spinbutton", { name: "Giá đến" })).toHaveValue("15.000.000");
  });

  it("'Xóa lọc' bỏ điều kiện lọc nhưng giữ từ khoá và sắp xếp", async () => {
    currentSearch = "q=laptop&brand=ASUS&min=5000000&sort=rating";
    const user = setupUser();
    renderWithAntd(<FilterPanel facets={facets} />);
    await user.click(screen.getByRole("button", { name: "Xóa lọc" }));
    expect(lastQuery()).toEqual({ q: "laptop", sort: "rating" });
  });

  it("ẩn 'Xóa lọc' khi chưa có điều kiện lọc nào (chỉ có từ khoá, sắp xếp)", () => {
    currentSearch = "q=laptop&sort=rating";
    renderWithAntd(<FilterPanel facets={facets} />);
    expect(screen.queryByRole("button", { name: "Xóa lọc" })).not.toBeInTheDocument();
  });
});
