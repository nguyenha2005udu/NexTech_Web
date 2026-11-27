import { screen, waitFor } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { updateUser } from "../actions";
import { AccountStatusToggle } from "./AccountStatusToggle";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace: jest.fn() }) }));
jest.mock("../actions", () => ({ updateUser: jest.fn() }));

const mockUpdate = jest.mocked(updateUser);
const active = { id: "cccccccc-0000-4000-8000-000000000001", full_name: "Nguyễn Văn A", is_active: true };

describe("AccountStatusToggle", () => {
  it("bấm 'Khoá' → hỏi lại kèm cảnh báo đăng xuất; chưa gọi action", async () => {
    const user = setupUser();
    renderWithAntd(<AccountStatusToggle user={active} />);
    await user.click(screen.getByRole("button", { name: "Khoá tài khoản Nguyễn Văn A" }));
    expect(await screen.findByText("Khoá tài khoản Nguyễn Văn A?")).toBeInTheDocument();
    expect(
      screen.getByText("Người dùng sẽ bị đăng xuất trong tối đa 15 phút và không đăng nhập lại được."),
    ).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("bấm Huỷ → không gọi action", async () => {
    const user = setupUser();
    renderWithAntd(<AccountStatusToggle user={active} />);
    await user.click(screen.getByRole("button", { name: "Khoá tài khoản Nguyễn Văn A" }));
    await user.click(await screen.findByRole("button", { name: "Huỷ" }));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("xác nhận khoá → gọi action 1 lần với is_active=false, báo thành công", async () => {
    const user = setupUser();
    mockUpdate.mockResolvedValueOnce({ ok: true });
    renderWithAntd(<AccountStatusToggle user={active} />);
    await user.click(screen.getByRole("button", { name: "Khoá tài khoản Nguyễn Văn A" }));
    await user.click(await screen.findByRole("button", { name: "Khoá" }));
    expect(await screen.findByText("Đã khoá tài khoản")).toBeInTheDocument();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ id: active.id, is_active: false });
  });

  it("tài khoản bị khoá → 'Mở khoá' gọi action với is_active=true", async () => {
    const user = setupUser();
    mockUpdate.mockResolvedValueOnce({ ok: true });
    renderWithAntd(<AccountStatusToggle user={{ ...active, is_active: false }} variant="button" />);
    await user.click(screen.getByRole("button", { name: "Mở khoá tài khoản Nguyễn Văn A" }));
    expect(await screen.findByText("Mở khoá tài khoản Nguyễn Văn A?")).toBeInTheDocument();
    const okButtons = screen.getAllByRole("button", { name: "Mở khoá" });
    await user.click(okButtons[okButtons.length - 1]!);
    expect(await screen.findByText("Đã mở khoá tài khoản")).toBeInTheDocument();
    expect(mockUpdate).toHaveBeenCalledWith({ id: active.id, is_active: true });
  });

  it("lỗi backend → hiện nguyên câu và tải lại trang", async () => {
    const user = setupUser();
    mockUpdate.mockResolvedValueOnce({ ok: false, message: "Không tìm thấy người dùng" });
    renderWithAntd(<AccountStatusToggle user={active} />);
    await user.click(screen.getByRole("button", { name: "Khoá tài khoản Nguyễn Văn A" }));
    await user.click(await screen.findByRole("button", { name: "Khoá" }));
    expect(await screen.findByText("Không tìm thấy người dùng")).toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
});
