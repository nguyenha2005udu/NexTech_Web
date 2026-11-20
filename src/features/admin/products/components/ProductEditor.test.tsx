import { screen, waitFor } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { saveProduct } from "../actions";
import { emptyBasicValues } from "../product.rules";
import { ProductEditor, type ProductEditorProps } from "./ProductEditor";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/products",
  useSearchParams: () => new URLSearchParams("modal=create"),
}));
jest.mock("../actions", () => ({
  saveProduct: jest.fn(),
  addProductImage: jest.fn(),
  setPrimaryImage: jest.fn(),
  removeProductImage: jest.fn(),
  addProductSpec: jest.fn(),
  updateProductSpec: jest.fn(),
  removeProductSpec: jest.fn(),
  addProductTag: jest.fn(),
  removeProductTag: jest.fn(),
}));

const mockSave = jest.mocked(saveProduct);
const P = "bbbbbbbb-0000-4000-8000-000000000101";
const CAT = "bbbbbbbb-0000-4000-8000-000000000011";
const categories = [{ id: CAT, name: "Tai nghe" }];

const createProps: ProductEditorProps = { mode: "create", initialValues: emptyBasicValues(CAT), categories, brands: ["NexTech"] };
const editProps = (partial: boolean): ProductEditorProps => ({
  mode: "edit",
  productId: P,
  partial,
  initialValues: {
    name: "Tai nghe cũ",
    categoryId: partial ? undefined : CAT,
    brand: "NexTech",
    price: 150_000,
    description: "",
    stockQuantity: 0,
    isActive: false,
  },
  images: [],
  specs: [],
  tags: [],
  categories,
  brands: [],
});

const tab = (name: string) => screen.getByRole("tab", { name });

describe("ProductEditor — chế độ thêm", () => {
  it("tiêu đề, nút chính 'Thêm sản phẩm'; 3 tab Ảnh / Thông số / Tags bị khoá", () => {
    renderWithAntd(<ProductEditor {...createProps} />);
    expect(screen.getByText("Thêm sản phẩm", { selector: ".ant-modal-title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm sản phẩm" })).toBeInTheDocument();
    for (const name of ["Ảnh", "Thông số", "Tags"]) expect(tab(name)).toHaveAttribute("aria-disabled", "true");
    expect(tab("Thông tin cơ bản")).toHaveAttribute("aria-selected", "true");
  });

  it("danh mục đổ sẵn, tồn kho 0, mặc định đang bán", () => {
    renderWithAntd(<ProductEditor {...createProps} />);
    expect(screen.getByText("Tai nghe")).toBeInTheDocument();
    expect(screen.getByLabelText("Tồn kho")).toHaveValue("0");
    expect(screen.getByRole("checkbox", { name: "Đang bán" })).toBeChecked();
  });

  it("bỏ trống tên và giá → báo lỗi, không gọi Server Action", async () => {
    const user = setupUser();
    renderWithAntd(<ProductEditor {...createProps} />);
    await user.click(screen.getByRole("button", { name: "Thêm sản phẩm" }));
    expect(await screen.findByText("Vui lòng nhập tên sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập giá")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("tạo xong chuyển sang chế độ sửa (?modal=edit&id=) để thêm ảnh", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: true, data: { id: P } });
    renderWithAntd(<ProductEditor {...createProps} />);
    await user.type(screen.getByLabelText("Tên sản phẩm"), "Tai nghe Mới");
    await user.type(screen.getByLabelText("Giá (₫)"), "1990000");
    await user.click(screen.getByRole("button", { name: "Thêm sản phẩm" }));

    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ name: "Tai nghe Mới", price: 1_990_000, categoryId: CAT, isActive: true }),
      ),
    );
    expect(await screen.findByText("Đã tạo sản phẩm, tiếp tục thêm ảnh")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(`/admin/products?modal=edit&id=${P}`, { scroll: false });
  });

  it("ô giá hiện dấu chấm phân cách nghìn", async () => {
    const user = setupUser();
    renderWithAntd(<ProductEditor {...createProps} />);
    await user.type(screen.getByLabelText("Giá (₫)"), "34990000");
    expect(screen.getByLabelText("Giá (₫)")).toHaveValue("34.990.000");
  });
});

describe("ProductEditor — chế độ sửa", () => {
  it("đủ dữ liệu: 4 tab mở được, nút chính 'Lưu thay đổi', lưu xong đóng modal", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: true, data: { id: P } });
    renderWithAntd(<ProductEditor {...editProps(false)} />);
    expect(screen.getByText("Sửa sản phẩm")).toBeInTheDocument();
    for (const name of ["Ảnh", "Thông số", "Tags"]) expect(tab(name)).not.toHaveAttribute("aria-disabled", "true");

    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(P, expect.objectContaining({ name: "Tai nghe cũ", categoryId: CAT })));
    expect(await screen.findByText("Đã lưu sản phẩm")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/admin/products", { scroll: false });
  });

  it("sang tab khác thì footer chỉ còn nút Đóng", async () => {
    const user = setupUser();
    renderWithAntd(<ProductEditor {...editProps(false)} />);
    await user.click(tab("Thông số"));
    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu thay đổi" })).not.toBeInTheDocument();
  });

  it("SP ngừng bán (partial): cảnh báo, khoá 3 tab, danh mục không bắt buộc, chỉ gửi trường đã đổi", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: true, data: { id: P } });
    renderWithAntd(<ProductEditor {...editProps(true)} />);
    expect(screen.getByText(/Sản phẩm đang ngừng bán: chưa tải được mô tả/)).toBeInTheDocument();
    for (const name of ["Ảnh", "Thông số", "Tags"]) expect(tab(name)).toHaveAttribute("aria-disabled", "true");

    await user.click(screen.getByRole("checkbox", { name: "Đang bán" }));
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(P, { isActive: true }));
  });

  it("partial mà chưa đổi gì → báo 'Chưa có thay đổi', không gọi API", async () => {
    const user = setupUser();
    renderWithAntd(<ProductEditor {...editProps(true)} />);
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(await screen.findByText("Chưa có thay đổi")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("lỗi chung từ Server Action hiện bằng thông báo, modal vẫn mở", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: false, message: "Không tìm thấy sản phẩm" });
    renderWithAntd(<ProductEditor {...editProps(false)} />);
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(await screen.findByText("Không tìm thấy sản phẩm")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
