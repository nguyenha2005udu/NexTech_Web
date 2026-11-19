import { act, renderHook } from "@testing-library/react";
import { useProductFilters } from "./useProductFilters";

const replace = jest.fn();
let currentSearch = "";

jest.mock("next/navigation", () => ({
  usePathname: () => "/categories/laptop",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

function renderWithUrl(search: string) {
  currentSearch = search;
  return renderHook(() => useProductFilters());
}

describe("useProductFilters", () => {
  it("đọc bộ lọc từ URL", () => {
    const { result } = renderWithUrl("q=laptop&brand=ASUS,Dell&min=10000000&sort=price-asc");
    expect(result.current.filters).toEqual({
      q: "laptop",
      brands: ["ASUS", "Dell"],
      rams: [],
      cpus: [],
      min: 10_000_000,
      max: undefined,
      sort: "price-asc",
    });
  });

  it("ghi bộ lọc lên URL bằng replace và không cuộn trang", () => {
    const { result } = renderWithUrl("");
    act(() => result.current.setFilters({ ...result.current.filters, brands: ["HP"], max: 20_000_000 }));
    expect(replace).toHaveBeenCalledWith("/categories/laptop?brand=HP&max=20000000", { scroll: false });
  });

  it("bỏ dấu ? khi không còn tham số nào", () => {
    const { result } = renderWithUrl("brand=HP");
    act(() => result.current.setFilters({ ...result.current.filters, brands: [] }));
    expect(replace).toHaveBeenCalledWith("/categories/laptop", { scroll: false });
  });

  it("toggleValue thêm giá trị chưa chọn", () => {
    const { result } = renderWithUrl("brand=ASUS");
    act(() => result.current.toggleValue("brands", "Dell"));
    expect(replace).toHaveBeenCalledWith("/categories/laptop?brand=ASUS%2CDell", { scroll: false });
  });

  it("toggleValue bỏ giá trị đã chọn", () => {
    const { result } = renderWithUrl("brand=ASUS,Dell&ram=16 GB");
    act(() => result.current.toggleValue("brands", "ASUS"));
    expect(replace).toHaveBeenCalledWith("/categories/laptop?brand=Dell&ram=16+GB", { scroll: false });
  });

  it("clearFilters giữ từ khoá và cách sắp xếp", () => {
    const { result } = renderWithUrl("q=laptop&brand=ASUS&ram=16 GB&min=1&max=2&sort=rating");
    act(() => result.current.clearFilters());
    expect(replace).toHaveBeenCalledWith("/categories/laptop?q=laptop&sort=rating", { scroll: false });
  });
});
