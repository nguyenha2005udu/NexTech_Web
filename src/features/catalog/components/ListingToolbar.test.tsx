import { screen } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { ListingToolbar } from "./ListingToolbar";

const replace = jest.fn();
let currentSearch = "";
jest.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

const lastQuery = () => Object.fromEntries(new URL(String(replace.mock.calls.at(-1)?.[0]), "http://x").searchParams);

beforeEach(() => {
  currentSearch = "";
});
afterEach(() => jest.clearAllMocks());

describe("ListingToolbar", () => {
  it("chưa lọc gì thì không có chip nào", () => {
    renderWithAntd(<ListingToolbar />);
    expect(screen.queryByRole("button", { name: /Bỏ lọc/ })).not.toBeInTheDocument();
  });

  it("hiện chip cho thương hiệu, RAM, bộ xử lý đang lọc", () => {
    currentSearch = "brand=ASUS&ram=16+GB&cpu=Intel+Core+i5";
    renderWithAntd(<ListingToolbar />);
    expect(screen.getByRole("button", { name: "Bỏ lọc ASUS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bỏ lọc RAM 16 GB" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bỏ lọc Intel Core i5" })).toBeInTheDocument();
  });

  it("bấm chip thì bỏ đúng giá trị đó khỏi URL", async () => {
    currentSearch = "brand=ASUS,Acer";
    const user = setupUser();
    renderWithAntd(<ListingToolbar />);
    await user.click(screen.getByRole("button", { name: "Bỏ lọc ASUS" }));
    expect(lastQuery()).toEqual({ brand: "Acer" });
  });

  it.each([
    ["min=5000000&max=15000000", "5–15 triệu"],
    ["min=5500000", "Từ 5,5 triệu"],
    ["max=20000000", "Đến 20 triệu"],
  ])("chip giá cho %s là '%s'", (search, label) => {
    currentSearch = search;
    renderWithAntd(<ListingToolbar />);
    expect(screen.getByRole("button", { name: `Bỏ lọc giá ${label}` })).toBeInTheDocument();
  });

  it("bấm chip giá thì bỏ cả min và max, giữ lọc khác", async () => {
    currentSearch = "brand=ASUS&min=5000000&max=15000000";
    const user = setupUser();
    renderWithAntd(<ListingToolbar />);
    await user.click(screen.getByRole("button", { name: /Bỏ lọc giá/ }));
    expect(lastQuery()).toEqual({ brand: "ASUS" });
  });

  it("hiện cách sắp xếp hiện tại và đổi được sang giá tăng dần", async () => {
    currentSearch = "sort=rating";
    const user = setupUser();
    renderWithAntd(<ListingToolbar />);
    expect(screen.getByRole("combobox", { name: "Sắp xếp" })).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Sắp xếp" }));
    await user.click(await screen.findByText("Giá tăng dần"));
    expect(lastQuery()).toEqual({ sort: "price-asc" });
  });
});
