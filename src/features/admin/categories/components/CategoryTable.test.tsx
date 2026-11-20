import { screen, waitFor, within } from "@testing-library/react";
import type { AdminCategory } from "@/entities/category";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { hideCategory } from "../actions";
import { CategoryTable } from "./CategoryTable";
import { CategoryToolbar } from "./CategoryToolbar";

const replace = jest.fn();
let search = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/categories",
  useSearchParams: () => new URLSearchParams(search),
}));
jest.mock("../actions", () => ({ hideCategory: jest.fn(), saveCategory: jest.fn() }));

const mockHide = jest.mocked(hideCategory);

let seq = 0;
function makeCategory(override: Partial<AdminCategory> = {}): AdminCategory {
  seq += 1;
  return {
    id: `bbbbbbbb-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    name: `Danh mục ${seq}`,
    icon: null,
    sortOrder: seq,
    isActive: true,
    createdAt: "2026-01-12T03:00:00.000Z",
    industry_id: null,
    ...override,
  };
}

beforeEach(() => {
  search = "";
});

describe("CategoryTable", () => {
  it("hiện tên, thứ tự, trạng thái và ngày tạo", () => {
    renderWithAntd(<CategoryTable items={[makeCategory({ name: "Laptop", sortOrder: 1 })]} total={1} page={1} pageSize={20} />);
    const row = screen.getByRole("row", { name: /Laptop/ });
    expect(within(row).getByText("1")).toBeInTheDocument();
    expect(within(row).getByText("Hiển thị")).toBeInTheDocument();
    expect(within(row).getByText("12/01/2026")).toBeInTheDocument();
  });

  it("icon emoji hiện nguyên, URL hiện ảnh, rỗng hiện dấu —", () => {
    renderWithAntd(
      <CategoryTable
        items={[
          makeCategory({ name: "Laptop", icon: "💻" }),
          makeCategory({ name: "Tai nghe", icon: "https://cdn.example.com/tai-nghe.png" }),
          makeCategory({ name: "Phụ kiện", icon: null }),
        ]}
        total={3}
        page={1}
        pageSize={20}
      />,
    );
    expect(within(screen.getByRole("row", { name: /Laptop/ })).getByText("💻")).toBeInTheDocument();
    const img = within(screen.getByRole("row", { name: /Tai nghe/ })).getByRole("presentation");
    expect(img).toHaveAttribute("src", "https://cdn.example.com/tai-nghe.png");
    expect(within(screen.getByRole("row", { name: /Phụ kiện/ })).getByText("—")).toBeInTheDocument();
  });

  it("danh mục đang hiển thị có nút Ẩn; danh mục đã ẩn chỉ có Sửa", () => {
    renderWithAntd(
      <CategoryTable
        items={[makeCategory({ name: "Laptop" }), makeCategory({ name: "Máy ảnh", isActive: false })]}
        total={2}
        page={1}
        pageSize={20}
      />,
    );
    const shown = screen.getByRole("row", { name: /Laptop/ });
    const hidden = screen.getByRole("row", { name: /Máy ảnh/ });
    expect(within(shown).getByRole("button", { name: "Ẩn" })).toBeInTheDocument();
    expect(within(hidden).queryByRole("button", { name: "Ẩn" })).not.toBeInTheDocument();
    expect(within(hidden).getByRole("button", { name: "Sửa" })).toBeInTheDocument();
  });

  it("bấm Sửa mở modal sửa qua URL", async () => {
    const user = setupUser();
    const category = makeCategory({ name: "Laptop" });
    renderWithAntd(<CategoryTable items={[category]} total={1} page={1} pageSize={20} />);
    await user.click(screen.getByRole("button", { name: "Sửa" }));
    expect(replace).toHaveBeenCalledWith(`/admin/categories?modal=edit&id=${category.id}`, { scroll: false });
  });

  it("bấm Ẩn hỏi xác nhận, đồng ý thì gọi hideCategory và báo thành công", async () => {
    const user = setupUser();
    mockHide.mockResolvedValueOnce({ ok: true });
    const category = makeCategory({ name: "Laptop" });
    renderWithAntd(<CategoryTable items={[category]} total={1} page={1} pageSize={20} />);

    await user.click(screen.getByRole("button", { name: "Ẩn" }));
    expect(await screen.findByText("Ẩn danh mục “Laptop”?")).toBeInTheDocument();
    expect(mockHide).not.toHaveBeenCalled();

    const dialog = screen.getByText("Danh mục sẽ không hiện ở trang bán hàng.").closest(".ant-popover") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Ẩn" }));
    await waitFor(() => expect(mockHide).toHaveBeenCalledWith(category.id));
    expect(await screen.findByText("Đã ẩn danh mục")).toBeInTheDocument();
  });

  it("ẩn thất bại thì hiện thông báo lỗi của backend", async () => {
    const user = setupUser();
    mockHide.mockResolvedValueOnce({ ok: false, message: "Không tìm thấy danh mục" });
    renderWithAntd(<CategoryTable items={[makeCategory({ name: "Laptop" })]} total={1} page={1} pageSize={20} />);

    await user.click(screen.getByRole("button", { name: "Ẩn" }));
    const dialog = (await screen.findByText("Danh mục sẽ không hiện ở trang bán hàng.")).closest(".ant-popover") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Ẩn" }));
    expect(await screen.findByText("Không tìm thấy danh mục")).toBeInTheDocument();
  });

  it("không có dữ liệu thì hiện thông báo rỗng", () => {
    renderWithAntd(<CategoryTable items={[]} total={0} page={1} pageSize={20} />);
    expect(screen.getByText("Không có dữ liệu phù hợp")).toBeInTheDocument();
  });

  it("không hiện phân trang khi chỉ có một trang", () => {
    renderWithAntd(<CategoryTable items={[makeCategory()]} total={5} page={1} pageSize={20} />);
    expect(screen.queryByTitle("Trang sau")).not.toBeInTheDocument();
    expect(document.querySelector(".ant-pagination")).toBeNull();
  });

  it("nhiều trang thì có phân trang; bấm trang 2 ghi ?page=2", async () => {
    const user = setupUser();
    renderWithAntd(<CategoryTable items={[makeCategory()]} total={45} page={1} pageSize={20} />);
    // antd 6 gắn click vào <a role="button"> bên trong <li title="2">
    await user.click(within(screen.getByTitle("2")).getByRole("button"));
    expect(replace).toHaveBeenCalledWith("/admin/categories?page=2", { scroll: false });
  });
});

describe("CategoryToolbar", () => {
  it("bấm Thêm danh mục mở modal thêm qua URL, giữ bộ lọc", async () => {
    const user = setupUser();
    search = "status=hidden";
    renderWithAntd(<CategoryToolbar />);
    await user.click(screen.getByRole("button", { name: /Thêm danh mục/ }));
    expect(replace).toHaveBeenCalledWith("/admin/categories?status=hidden&modal=create", { scroll: false });
  });

  it("gõ tìm kiếm ghi ?q sau khi dừng gõ", async () => {
    const user = setupUser();
    renderWithAntd(<CategoryToolbar />);
    await user.type(screen.getByRole("textbox", { name: "Tìm danh mục" }), "tai nghe");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/categories?q=tai+nghe", { scroll: false }));
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
