import { screen, waitFor } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { saveCategory } from "../actions";
import type { CategoryFormValues } from "../schemas";
import { CategoryEditor } from "./CategoryEditor";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/categories",
  useSearchParams: () => new URLSearchParams("modal=edit&id=x"),
}));
jest.mock("../actions", () => ({ saveCategory: jest.fn(), hideCategory: jest.fn() }));

const mockSave = jest.mocked(saveCategory);
const ID = "bbbbbbbb-0000-4000-8000-000000000011";
const industries = [{ id: "bbbbbbbb-0000-4000-8000-000000000001", name: "Điện tử" }];
const createValues: CategoryFormValues = { name: "", icon: "", sortOrder: 9, industryId: undefined, isActive: true };

function renderEditor(props: Partial<Parameters<typeof CategoryEditor>[0]> = {}) {
  return renderWithAntd(<CategoryEditor mode="create" initialValues={createValues} industries={industries} {...props} />);
}

describe("CategoryEditor / CategoryFormModal", () => {
  it("chế độ thêm: tiêu đề 'Thêm danh mục', thứ tự đổ sẵn, mặc định hiển thị", () => {
    renderEditor();
    expect(screen.getByText("Thêm danh mục")).toBeInTheDocument();
    expect(screen.getByLabelText("Thứ tự hiển thị")).toHaveValue("9");
    expect(screen.getByRole("checkbox", { name: "Hiển thị" })).toBeChecked();
  });

  it("chế độ sửa: tiêu đề 'Sửa danh mục' và đổ sẵn giá trị", () => {
    renderEditor({
      mode: "edit",
      categoryId: ID,
      initialValues: { name: "Tai nghe", icon: "🎧", sortOrder: 5, industryId: undefined, isActive: false },
    });
    expect(screen.getByText("Sửa danh mục")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên danh mục")).toHaveValue("Tai nghe");
    expect(screen.getByLabelText("Icon (emoji hoặc URL)")).toHaveValue("🎧");
    expect(screen.getByRole("checkbox", { name: "Hiển thị" })).not.toBeChecked();
  });

  it("bấm Lưu khi tên trống → báo lỗi, không gọi Server Action", async () => {
    const user = setupUser();
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Vui lòng nhập tên danh mục")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("bỏ trống ngành học vẫn lưu được; thành công thì báo và đóng modal", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: true });
    renderEditor();
    await user.type(screen.getByLabelText("Tên danh mục"), "Laptop");
    await user.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(null, expect.objectContaining({ name: "Laptop", sortOrder: 9, isActive: true })),
    );
    expect(await screen.findByText("Đã lưu danh mục")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/admin/categories", { scroll: false });
  });

  it("sửa thì gửi kèm id danh mục", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: true });
    renderEditor({ mode: "edit", categoryId: ID, initialValues: { ...createValues, name: "Tai nghe" } });
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(ID, expect.objectContaining({ name: "Tai nghe" })));
  });

  it("lỗi theo ô từ Server Action hiện dưới ô đó, modal vẫn mở", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: false, message: "x", fieldErrors: { name: "Tên đã tồn tại" } });
    renderEditor();
    await user.type(screen.getByLabelText("Tên danh mục"), "Laptop");
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Tên đã tồn tại")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("lỗi chung hiện bằng thông báo", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: false, message: "Không tìm thấy ngành học" });
    renderEditor();
    await user.type(screen.getByLabelText("Tên danh mục"), "Laptop");
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Không tìm thấy ngành học")).toBeInTheDocument();
  });

  it("bấm Huỷ đóng modal bằng cách bỏ ?modal khỏi URL", async () => {
    const user = setupUser();
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(replace).toHaveBeenCalledWith("/admin/categories", { scroll: false });
  });
});
