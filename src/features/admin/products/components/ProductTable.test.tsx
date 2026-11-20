import { screen, waitFor, within } from "@testing-library/react";
import type { AdminProductListItem } from "@/entities/product";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { deleteProduct } from "../actions";
import { ProductTable } from "./ProductTable";
import { ProductToolbar } from "./ProductToolbar";

const replace = jest.fn();
let search = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/products",
  useSearchParams: () => new URLSearchParams(search),
}));
jest.mock("../actions", () => ({ deleteProduct: jest.fn() }));

const mockDelete = jest.mocked(deleteProduct);

let seq = 0;
function makeRow(override: Partial<AdminProductListItem> = {}): AdminProductListItem {
  seq += 1;
  return {
    id: `bbbbbbbb-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    name: `Sản phẩm ${seq}`,
    category: "Laptop",
    brand: "Apple",
    price: 34_990_000,
    rating: "4.9",
    stock_quantity: 12,
    is_active: true,
    created_at: "2026-11-15T14:10:56.793Z",
    thumbnail: "https://cdn.example.com/p.jpg",
    ...override,
  };
}

// sticky + scroll.y: antd render header 2 lần (header dính + bản đo cột) → lấy bản đầu
const columnTitle = (title: string) => screen.getAllByText(title)[0] as HTMLElement;

const renderTable = (items: AdminProductListItem[], extra: Partial<Parameters<typeof ProductTable>[0]> = {}) =>
  renderWithAntd(<ProductTable items={items} total={items.length} page={1} pageSize={20} sort={undefined} {...extra} />);

beforeEach(() => {
  search = "";
});

describe("ProductTable", () => {
  it("hiện ảnh, tên, thương hiệu, danh mục, giá, rating, tồn kho, trạng thái", () => {
    renderTable([makeRow({ name: "Laptop UltraBook Pro 14 M3" })]);
    const row = screen.getByRole("row", { name: /Laptop UltraBook Pro 14 M3/ });
    expect(within(row).getByRole("presentation")).toHaveAttribute("src", "https://cdn.example.com/p.jpg");
    expect(within(row).getByText("Apple")).toBeInTheDocument();
    expect(within(row).getByText("Laptop")).toBeInTheDocument();
    expect(within(row).getByText("34.990.000 ₫")).toBeInTheDocument();
    expect(within(row).getByText("★ 4,9")).toBeInTheDocument();
    expect(within(row).getByText("12")).toBeInTheDocument();
    expect(within(row).getByText("Đang bán")).toBeInTheDocument();
  });

  it("thiếu ảnh hiện ô giữ chỗ; chưa có rating, thương hiệu hiện dấu —", () => {
    renderTable([makeRow({ name: "SP trống", thumbnail: null, rating: null, brand: null })]);
    const row = screen.getByRole("row", { name: /SP trống/ });
    expect(within(row).queryByRole("presentation")).not.toBeInTheDocument();
    expect(within(row).getAllByText("—")).toHaveLength(2);
  });

  it("tồn kho ≤ 5 tô đỏ, 0 hiện 'Hết hàng'; ngừng bán hiện tag xám", () => {
    renderTable([
      makeRow({ name: "Sắp hết", stock_quantity: 5 }),
      makeRow({ name: "Đã hết", stock_quantity: 0, is_active: false }),
    ]);
    expect(within(screen.getByRole("row", { name: /Sắp hết/ })).getByText("5")).toHaveClass("stockLow");
    const out = screen.getByRole("row", { name: /Đã hết/ });
    expect(within(out).getByText("Hết hàng")).toBeInTheDocument();
    expect(within(out).getByText("Ngừng bán")).toBeInTheDocument();
  });

  it("bấm tiêu đề GIÁ sắp tăng dần qua ?sort=price_asc", async () => {
    const user = setupUser();
    renderTable([makeRow()]);
    await user.click(columnTitle("GIÁ"));
    expect(replace).toHaveBeenCalledWith("/admin/products?sort=price_asc", { scroll: false });
  });

  it("đang sắp giá tăng, bấm lại thành giảm; RATING chỉ giảm dần", async () => {
    const user = setupUser();
    renderTable([makeRow()], { sort: "price_asc" });
    await user.click(columnTitle("GIÁ"));
    expect(replace).toHaveBeenLastCalledWith("/admin/products?sort=price_desc", { scroll: false });
    await user.click(columnTitle("RATING"));
    expect(replace).toHaveBeenLastCalledWith("/admin/products?sort=rating_desc", { scroll: false });
  });

  it("bấm Sửa mở modal sửa qua URL", async () => {
    const user = setupUser();
    const row = makeRow();
    renderTable([row]);
    await user.click(screen.getByRole("button", { name: "Sửa" }));
    expect(replace).toHaveBeenCalledWith(`/admin/products?modal=edit&id=${row.id}`, { scroll: false });
  });

  it("bấm Xoá cảnh báo mất ảnh, đồng ý thì xoá và báo thành công", async () => {
    const user = setupUser();
    mockDelete.mockResolvedValueOnce({ ok: true });
    const row = makeRow({ name: "Laptop X" });
    renderTable([row]);
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    const note = await screen.findByText("Ảnh của sản phẩm cũng bị xoá, không hoàn tác được.");
    expect(screen.getByText("Xoá sản phẩm “Laptop X”?")).toBeInTheDocument();
    await user.click(within(note.closest(".ant-popover") as HTMLElement).getByRole("button", { name: "Xoá" }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(row.id));
    expect(await screen.findByText("Đã xoá sản phẩm")).toBeInTheDocument();
  });

  it("đổi trang ghi ?page; đổi số dòng/trang ghi ?size", async () => {
    const user = setupUser();
    renderTable([makeRow()], { total: 45 });
    await user.click(within(screen.getByTitle("2")).getByRole("button"));
    expect(replace).toHaveBeenCalledWith("/admin/products?page=2", { scroll: false });
    expect(screen.getByText("45 sản phẩm")).toBeInTheDocument();
  });

  it("không có dữ liệu thì hiện thông báo rỗng", () => {
    renderTable([]);
    expect(screen.getByText("Không có dữ liệu phù hợp")).toBeInTheDocument();
  });
});

describe("ProductToolbar", () => {
  const categories = [{ id: "bbbbbbbb-0000-4000-8000-000000000011", name: "Tai nghe" }];

  it("có ô tìm, 2 bộ lọc và nút thêm; bấm thêm mở modal giữ bộ lọc", async () => {
    const user = setupUser();
    search = "brand=Apple";
    renderWithAntd(<ProductToolbar categories={categories} brands={["Apple", "Sony"]} />);
    expect(screen.getByRole("textbox", { name: "Tìm sản phẩm" })).toBeInTheDocument();
    expect(screen.getByText("Tất cả danh mục")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Thêm sản phẩm/ }));
    expect(replace).toHaveBeenCalledWith("/admin/products?brand=Apple&modal=create", { scroll: false });
  });

  it("gõ tìm kiếm ghi ?q sau khi dừng gõ", async () => {
    const user = setupUser();
    renderWithAntd(<ProductToolbar categories={categories} brands={[]} />);
    await user.type(screen.getByRole("textbox", { name: "Tìm sản phẩm" }), "laptop");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/products?q=laptop", { scroll: false }));
  });
});
