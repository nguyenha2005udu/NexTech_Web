import { screen, within } from "@testing-library/react";
import type { AdminUserListItem } from "@/entities/user";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { UserTable } from "./UserTable";
import { UserToolbar } from "./UserToolbar";

const replace = jest.fn();
let search = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: jest.fn() }),
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams(search),
}));
jest.mock("../actions", () => ({ updateUser: jest.fn() }));

const ME = "aaaaaaaa-0000-4000-8000-000000000001";

let seq = 0;
function makeUser(override: Partial<AdminUserListItem> = {}): AdminUserListItem {
  seq += 1;
  return {
    id: `cccccccc-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    full_name: `Người dùng ${seq}`,
    email: `u${seq}@nextech.local`,
    phone_number: "0912345678",
    avatar_url: null,
    role: "user",
    is_active: true,
    created_at: "2026-07-20T18:30:00.000Z",
    ...override,
  };
}

const rowOf = (name: string) => screen.getByRole("row", { name: new RegExp(name) });

beforeEach(() => {
  search = "";
});

describe("UserTable", () => {
  it("hiện tên, email, SĐT, vai trò, trạng thái, ngày tạo (giờ VN)", () => {
    const u = makeUser({ full_name: "Nguyễn Văn A", email: "a@gmail.com" });
    renderWithAntd(<UserTable items={[u]} total={1} page={1} pageSize={20} currentUserId={ME} />);
    const row = rowOf("Nguyễn Văn A");
    expect(within(row).getByText("a@gmail.com")).toBeInTheDocument();
    expect(within(row).getByText("0912345678")).toBeInTheDocument();
    expect(within(row).getByText("Khách hàng")).toBeInTheDocument();
    expect(within(row).getByText("Hoạt động")).toBeInTheDocument();
    expect(within(row).getByText("21/07/2026")).toBeInTheDocument();
  });

  it("SĐT null → '—'; email null → không có dòng email", () => {
    const u = makeUser({ full_name: "Không Email", email: null, phone_number: null });
    renderWithAntd(<UserTable items={[u]} total={1} page={1} pageSize={20} currentUserId={ME} />);
    const row = rowOf("Không Email");
    expect(within(row).getByText("—")).toBeInTheDocument();
    expect(within(row).queryByText(/@/)).not.toBeInTheDocument();
  });

  it("tag Quản trị / Bị khoá; tài khoản bị khoá có nút Mở khoá", () => {
    const u = makeUser({ full_name: "Admin B", role: "admin", is_active: false });
    renderWithAntd(<UserTable items={[u]} total={1} page={1} pageSize={20} currentUserId={ME} />);
    const row = rowOf("Admin B");
    expect(within(row).getByText("Quản trị")).toBeInTheDocument();
    expect(within(row).getByText("Bị khoá")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Mở khoá tài khoản Admin B" })).toBeInTheDocument();
  });

  it("dòng của chính admin có '(Bạn)' và không có nút Khoá", () => {
    const me = makeUser({ id: ME, full_name: "Chính Tôi", role: "admin" });
    const other = makeUser({ full_name: "Người Khác" });
    renderWithAntd(<UserTable items={[me, other]} total={2} page={1} pageSize={20} currentUserId={ME} />);
    expect(within(rowOf("Chính Tôi")).getByText("(Bạn)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Khoá tài khoản Chính Tôi" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Khoá tài khoản Người Khác" })).toBeInTheDocument();
  });

  it("bấm 'Xem' → ?view=<id>, giữ bộ lọc, không về trang 1", async () => {
    search = "role=user&page=2";
    const user = setupUser();
    const u = makeUser({ full_name: "Xem Tôi" });
    renderWithAntd(<UserTable items={[u]} total={30} page={2} pageSize={20} currentUserId={ME} />);
    await user.click(screen.getByRole("button", { name: "Xem người dùng Xem Tôi" }));
    expect(replace).toHaveBeenCalledWith(`/admin/users?role=user&page=2&view=${u.id}`, { scroll: false });
  });

  it("danh sách rỗng → 'Không có dữ liệu phù hợp'", () => {
    renderWithAntd(<UserTable items={[]} total={0} page={1} pageSize={20} currentUserId={ME} />);
    expect(screen.getByText("Không có dữ liệu phù hợp")).toBeInTheDocument();
  });
});

describe("UserToolbar", () => {
  it("không có nút thêm; có ô tìm + 2 ô lọc", () => {
    renderWithAntd(<UserToolbar />);
    expect(screen.getByRole("textbox", { name: "Tìm người dùng" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Lọc vai trò" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Lọc trạng thái" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thêm/ })).not.toBeInTheDocument();
  });
});
