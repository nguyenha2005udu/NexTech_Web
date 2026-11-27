import { screen, waitFor } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { updateUser } from "../actions";
import { RoleSelect } from "./RoleSelect";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace: jest.fn() }) }));
jest.mock("../actions", () => ({ updateUser: jest.fn() }));

const mockUpdate = jest.mocked(updateUser);
const customer = { id: "cccccccc-0000-4000-8000-000000000001", full_name: "Nguyễn Văn A", role: "user" as const };

async function choose(user: ReturnType<typeof setupUser>, label: string) {
  await user.click(screen.getByRole("combobox", { name: "Vai trò của Nguyễn Văn A" }));
  const options = await screen.findAllByText(label);
  await user.click(options[options.length - 1]!);
}

describe("RoleSelect", () => {
  it("hiện vai trò hiện tại", () => {
    renderWithAntd(<RoleSelect user={customer} />);
    expect(screen.getByText("Khách hàng")).toBeInTheDocument();
  });

  it("chọn Quản trị → hỏi xác nhận cấp quyền; chưa gọi action", async () => {
    const user = setupUser();
    renderWithAntd(<RoleSelect user={customer} />);
    await choose(user, "Quản trị");
    expect(await screen.findByRole("button", { name: "Cấp quyền" })).toBeInTheDocument();
    expect(screen.getByText("Người này sẽ vào được toàn bộ khu quản trị.")).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("Huỷ → không gọi action, ô chọn giữ 'Khách hàng'", async () => {
    const user = setupUser();
    renderWithAntd(<RoleSelect user={customer} />);
    await choose(user, "Quản trị");
    await user.click(await screen.findByRole("button", { name: "Huỷ" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Cấp quyền" })).not.toBeInTheDocument());
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "Vai trò của Nguyễn Văn A" }).closest(".ant-select")).toHaveTextContent(
      "Khách hàng",
    );
  });

  it("OK → gọi action 1 lần với role=admin, báo thành công", async () => {
    const user = setupUser();
    mockUpdate.mockResolvedValueOnce({ ok: true });
    renderWithAntd(<RoleSelect user={customer} />);
    await choose(user, "Quản trị");
    await user.click(await screen.findByRole("button", { name: "Cấp quyền" }));
    expect(await screen.findByText("Đã đổi vai trò")).toBeInTheDocument();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ id: customer.id, role: "admin" });
  });

  it("admin → chọn Khách hàng hỏi 'Gỡ quyền'; lỗi backend hiện nguyên câu + tải lại", async () => {
    const user = setupUser();
    mockUpdate.mockResolvedValueOnce({ ok: false, message: "Không tìm thấy người dùng" });
    renderWithAntd(<RoleSelect user={{ ...customer, role: "admin" }} />);
    await choose(user, "Khách hàng");
    await user.click(await screen.findByRole("button", { name: "Gỡ quyền" }));
    expect(await screen.findByText("Không tìm thấy người dùng")).toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
});
