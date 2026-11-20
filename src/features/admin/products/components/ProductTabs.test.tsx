// Tab Ảnh / Thông số / Tags — mỗi thao tác gọi Server Action ngay (design/admin/03 §2.3–2.5).
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import {
  addProductImage,
  addProductSpec,
  addProductTag,
  removeProductImage,
  removeProductSpec,
  removeProductTag,
  setPrimaryImage,
  updateProductSpec,
} from "../actions";
import { ImageUploader } from "./ImageUploader";
import { SpecEditor } from "./SpecEditor";
import { TagEditor } from "./TagEditor";

jest.mock("../actions", () => ({
  addProductImage: jest.fn(),
  setPrimaryImage: jest.fn(),
  removeProductImage: jest.fn(),
  addProductSpec: jest.fn(),
  updateProductSpec: jest.fn(),
  removeProductSpec: jest.fn(),
  addProductTag: jest.fn(),
  removeProductTag: jest.fn(),
}));

const P = "bbbbbbbb-0000-4000-8000-000000000101";
const img = (id: string, primary: boolean, sort = 0) => ({ id, image_url: `https://cdn.vn/${id}.jpg`, is_primary: primary, sort_order: sort });
const popconfirmOk = async (user: ReturnType<typeof setupUser>, title: string, ok: string) => {
  const node = await screen.findByText(title);
  await user.click(within(node.closest(".ant-popover") as HTMLElement).getByRole("button", { name: ok }));
};

describe("ImageUploader", () => {
  it("hiện ảnh hiện có, đánh dấu ảnh chính", () => {
    renderWithAntd(<ImageUploader productId={P} initialImages={[img("a", true), img("b", false, 1)]} />);
    expect(within(screen.getByRole("list", { name: "Ảnh sản phẩm" })).getAllByRole("presentation")).toHaveLength(2);
    expect(screen.getByText("Ảnh chính")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Đặt làm chính" })).toHaveLength(1);
  });

  it("dán URL rồi Thêm → gọi action, ảnh đầu tiên là ảnh chính", async () => {
    const user = setupUser();
    jest.mocked(addProductImage).mockResolvedValueOnce({ ok: true, data: img("n", true) });
    renderWithAntd(<ImageUploader productId={P} initialImages={[]} />);
    await user.type(screen.getByRole("textbox", { name: "URL ảnh" }), "https://cdn.vn/n.jpg");
    await user.click(screen.getByRole("button", { name: "Thêm" }));
    await waitFor(() => expect(addProductImage).toHaveBeenCalled());
    const sent = jest.mocked(addProductImage).mock.calls[0]?.[0];
    expect(sent?.get("imageUrl")).toBe("https://cdn.vn/n.jpg");
    expect(sent?.get("isPrimary")).toBe("true");
    expect(await screen.findByText("Ảnh chính")).toBeInTheDocument();
  });

  it("URL sai báo lỗi ngay, không gọi action", async () => {
    const user = setupUser();
    renderWithAntd(<ImageUploader productId={P} initialImages={[]} />);
    await user.type(screen.getByRole("textbox", { name: "URL ảnh" }), "abc");
    await user.click(screen.getByRole("button", { name: "Thêm" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Nhập URL ảnh bắt đầu bằng http:// hoặc https://");
    expect(addProductImage).not.toHaveBeenCalled();
  });

  it("đặt ảnh khác làm ảnh chính", async () => {
    const user = setupUser();
    jest.mocked(setPrimaryImage).mockResolvedValueOnce({ ok: true, data: img("b", true, 1) });
    renderWithAntd(<ImageUploader productId={P} initialImages={[img("a", true), img("b", false, 1)]} />);
    await user.click(screen.getByRole("button", { name: "Đặt làm chính" }));
    await waitFor(() => expect(setPrimaryImage).toHaveBeenCalledWith(P, "b"));
  });

  it("xoá ảnh chính → ảnh còn lại thành ảnh chính (giống backend)", async () => {
    const user = setupUser();
    jest.mocked(removeProductImage).mockResolvedValueOnce({ ok: true });
    renderWithAntd(<ImageUploader productId={P} initialImages={[img("a", true), img("b", false, 1)]} />);
    await user.click(screen.getAllByRole("button", { name: "Xoá ảnh" })[0] as HTMLElement);
    await popconfirmOk(user, "Xoá ảnh này?", "Xoá");
    await waitFor(() => expect(removeProductImage).toHaveBeenCalledWith(P, "a"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Đặt làm chính" })).not.toBeInTheDocument());
    expect(screen.getByText("Ảnh chính")).toBeInTheDocument();
  });
});

describe("SpecEditor", () => {
  const spec = { id: "s1", spec_key: "RAM", spec_value: "16", spec_unit: "GB" };

  it("thêm thông số mới", async () => {
    const user = setupUser();
    jest.mocked(addProductSpec).mockResolvedValueOnce({ ok: true, data: { id: "s2", spec_key: "CPU", spec_value: "M3", spec_unit: null } });
    renderWithAntd(<SpecEditor productId={P} initialSpecs={[]} />);
    expect(screen.getByText("Chưa có thông số nào.")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Tên thông số mới" }), "CPU");
    await user.type(screen.getByRole("textbox", { name: "Giá trị mới" }), "M3");
    await user.click(screen.getByRole("button", { name: "+ Thêm thông số" }));
    await waitFor(() => expect(addProductSpec).toHaveBeenCalledWith(P, expect.objectContaining({ key: "CPU", value: "M3" })));
    expect(await screen.findByDisplayValue("M3")).toBeInTheDocument();
  });

  it("thiếu giá trị → báo lỗi, không gọi action", async () => {
    const user = setupUser();
    renderWithAntd(<SpecEditor productId={P} initialSpecs={[]} />);
    await user.type(screen.getByRole("textbox", { name: "Tên thông số mới" }), "CPU");
    await user.click(screen.getByRole("button", { name: "+ Thêm thông số" }));
    expect(await screen.findByText("Nhập giá trị")).toBeInTheDocument();
    expect(addProductSpec).not.toHaveBeenCalled();
  });

  it("sửa dòng: nút Lưu chỉ bật khi đã đổi", async () => {
    const user = setupUser();
    jest.mocked(updateProductSpec).mockResolvedValueOnce({ ok: true, data: { ...spec, spec_value: "32" } });
    renderWithAntd(<SpecEditor productId={P} initialSpecs={[spec]} />);
    const save = screen.getByRole("button", { name: "Lưu" });
    expect(save).toBeDisabled();
    const value = screen.getByRole("textbox", { name: "Giá trị RAM" });
    await user.clear(value);
    await user.type(value, "32");
    await user.click(save);
    await waitFor(() => expect(updateProductSpec).toHaveBeenCalledWith(P, "s1", { key: "RAM", value: "32", unit: "GB" }));
  });

  it("xoá dòng sau khi xác nhận", async () => {
    const user = setupUser();
    jest.mocked(removeProductSpec).mockResolvedValueOnce({ ok: true });
    renderWithAntd(<SpecEditor productId={P} initialSpecs={[spec]} />);
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    await popconfirmOk(user, "Xoá thông số “RAM”?", "Xoá");
    await waitFor(() => expect(removeProductSpec).toHaveBeenCalledWith(P, "s1"));
    expect(await screen.findByText("Chưa có thông số nào.")).toBeInTheDocument();
  });
});

describe("TagEditor", () => {
  it("gõ tên rồi Enter → gắn tag", async () => {
    const user = setupUser();
    jest.mocked(addProductTag).mockResolvedValueOnce({ ok: true, data: { id: "t2", name: "Gaming" } });
    renderWithAntd(<TagEditor productId={P} initialTags={[{ id: "t1", name: "Học tập" }]} />);
    await user.type(screen.getByRole("combobox", { name: "Tags của sản phẩm" }), "Gaming{Enter}");
    await waitFor(() => expect(addProductTag).toHaveBeenCalledWith(P, "Gaming"));
    expect(await screen.findByText("Gaming")).toBeInTheDocument();
  });

  it("bấm × để gỡ tag", async () => {
    const user = setupUser();
    jest.mocked(removeProductTag).mockResolvedValueOnce({ ok: true });
    renderWithAntd(<TagEditor productId={P} initialTags={[{ id: "t1", name: "Học tập" }]} />);
    // nút × của antd nằm trong aria-hidden (bàn phím gỡ bằng Backspace) → hidden: true
    await user.click(screen.getByRole("img", { name: "close", hidden: true }));
    await waitFor(() => expect(removeProductTag).toHaveBeenCalledWith(P, "t1"));
    await waitFor(() => expect(screen.queryByText("Học tập")).not.toBeInTheDocument());
  });

  it("gắn thất bại thì báo lỗi, không thêm tag", async () => {
    const user = setupUser();
    jest.mocked(addProductTag).mockResolvedValueOnce({ ok: false, message: "Không tìm thấy sản phẩm" });
    renderWithAntd(<TagEditor productId={P} initialTags={[]} />);
    await user.type(screen.getByRole("combobox", { name: "Tags của sản phẩm" }), "X{Enter}");
    expect(await screen.findByText("Không tìm thấy sản phẩm")).toBeInTheDocument();
  });
});
