import { screen, waitFor } from "@testing-library/react";
import type { AdminUserDetail } from "@/entities/user";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { UserDetail } from "./UserDetail";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: jest.fn() }),
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams("role=user&view=cccccccc-0000-4000-8000-000000000001"),
}));
jest.mock("../actions", () => ({ updateUser: jest.fn() }));

const ME = "aaaaaaaa-0000-4000-8000-000000000001";

function makeDetail(override: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    id: "cccccccc-0000-4000-8000-000000000001",
    full_name: "Nguyễn Văn A",
    email: "a@gmail.com",
    phone_number: null,
    avatar_url: null,
    role: "user",
    is_active: true,
    created_at: "2026-07-20T18:30:00.000Z",
    profile: { user_segment: "Sinh viên", occupation: null, age_range: "18-22", interests: ["Gaming", "Laptop"] },
    ...override,
  };
}

describe("UserDetail", () => {
  it("tiêu đề, mã người dùng, SĐT null '—', ngày tạo, hồ sơ mua sắm + sở thích", () => {
    renderWithAntd(<UserDetail user={makeDetail()} currentUserId={ME} />);
    expect(screen.getByText("Người dùng: Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("#CCCCCCCC")).toBeInTheDocument();
    expect(screen.getByText("21/07/2026")).toBeInTheDocument();
    expect(screen.getByText("Sinh viên")).toBeInTheDocument();
    expect(screen.getByText("18-22")).toBeInTheDocument();
    expect(screen.getByText("Gaming")).toBeInTheDocument();
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2); // SĐT + nghề nghiệp
  });

  it("người khác → có ô đổi vai trò và nút khoá", () => {
    renderWithAntd(<UserDetail user={makeDetail()} currentUserId={ME} />);
    expect(screen.getByRole("combobox", { name: "Vai trò của Nguyễn Văn A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Khoá tài khoản Nguyễn Văn A" })).toBeInTheDocument();
  });

  it("xem chính mình → chỉ đọc, có chú thích", () => {
    renderWithAntd(<UserDetail user={makeDetail({ id: ME, role: "admin" })} currentUserId={ME} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Khoá tài khoản/ })).not.toBeInTheDocument();
    expect(screen.getByText("Quản trị")).toBeInTheDocument();
    expect(screen.getByText("Không thể tự đổi vai trò hoặc khoá tài khoản của mình.")).toBeInTheDocument();
  });

  it("chưa có hồ sơ mua sắm → Empty", () => {
    renderWithAntd(<UserDetail user={makeDetail({ profile: null })} currentUserId={ME} />);
    expect(screen.getByText("Người dùng chưa khai báo hồ sơ mua sắm")).toBeInTheDocument();
  });

  it("sở thích rỗng → '—'", () => {
    const profile = { user_segment: "A", occupation: "B", age_range: "C", interests: [] };
    renderWithAntd(<UserDetail user={makeDetail({ phone_number: "09", profile })} currentUserId={ME} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("đóng Drawer → bỏ ?view, giữ bộ lọc", async () => {
    const user = setupUser();
    renderWithAntd(<UserDetail user={makeDetail()} currentUserId={ME} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(replace).toHaveBeenCalledWith("/admin/users?role=user", { scroll: false });
  });

  it("notFound → báo 'Không tìm thấy người dùng' và bỏ ?view; không render Drawer", async () => {
    renderWithAntd(<UserDetail user={null} currentUserId={ME} notFound />);
    expect(await screen.findByText("Không tìm thấy người dùng")).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/users?role=user", { scroll: false }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
