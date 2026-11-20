import { screen, waitFor, within } from "@testing-library/react";
import type { AdminOrderListItem } from "@/entities/order";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { AdminOrderTable } from "./AdminOrderTable";
import { AdminOrderToolbar } from "./AdminOrderToolbar";

const replace = jest.fn();
let search = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(search),
}));

let seq = 0;
function makeOrder(override: Partial<AdminOrderListItem> = {}): AdminOrderListItem {
  seq += 1;
  return {
    id: `a1b2c3d${seq % 10}-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    user_name: `Khách ${seq}`,
    product_count: 2,
    total: 64_980_000,
    status: "paid",
    created_at: "2026-07-24T03:24:00.000Z",
    ...override,
  };
}

beforeEach(() => {
  search = "";
});

describe("AdminOrderTable", () => {
  it("hiện mã đơn, khách, số SP, tổng tiền, trạng thái, ngày đặt (giờ VN)", () => {
    const order = makeOrder({ id: "a1b2c3d4-0000-4000-8000-000000000001", user_name: "Nguyễn Văn A" });
    renderWithAntd(<AdminOrderTable items={[order]} total={1} page={1} pageSize={20} />);
    const row = screen.getByRole("row", { name: /Nguyễn Văn A/ });
    expect(within(row).getByText("#A1B2C3D4")).toBeInTheDocument();
    expect(within(row).getByText("2")).toBeInTheDocument();
    expect(within(row).getByText("64.980.000 ₫")).toBeInTheDocument();
    expect(within(row).getByText("Đã thanh toán")).toBeInTheDocument();
    expect(within(row).getByText("24/07/2026 10:24")).toBeInTheDocument();
  });

  it("không có user_email → không render dòng email; có thì hiện dưới tên", () => {
    renderWithAntd(
      <AdminOrderTable
        items={[makeOrder({ user_name: "Không email" }), makeOrder({ user_name: "Có email", user_email: "vana@gmail.com" })]}
        total={2}
        page={1}
        pageSize={20}
      />,
    );
    expect(within(screen.getByRole("row", { name: /Không email/ })).queryByText(/@/)).not.toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /Có email/ })).getByText("vana@gmail.com")).toBeInTheDocument();
  });

  it("thiếu tên khách → —; trạng thái lạ → 'Không xác định'", () => {
    renderWithAntd(
      <AdminOrderTable
        items={[makeOrder({ user_name: null, status: "delivered" as AdminOrderListItem["status"] })]}
        total={1}
        page={1}
        pageSize={20}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Không xác định")).toBeInTheDocument();
  });

  it("bấm Xem mở Drawer qua ?view=<id>, giữ trang hiện tại", async () => {
    const user = setupUser();
    search = "status=paid&page=2";
    const order = makeOrder({ id: "e5f6a7b8-0000-4000-8000-000000000002" });
    renderWithAntd(<AdminOrderTable items={[order]} total={30} page={2} pageSize={20} />);
    await user.click(screen.getByRole("button", { name: "Xem đơn #E5F6A7B8" }));
    expect(replace).toHaveBeenCalledWith(`/admin/orders?status=paid&page=2&view=${order.id}`, { scroll: false });
  });

  it("không có dữ liệu → thông báo rỗng, không có phân trang", () => {
    renderWithAntd(<AdminOrderTable items={[]} total={0} page={1} pageSize={20} />);
    expect(screen.getByText("Không có dữ liệu phù hợp")).toBeInTheDocument();
    expect(document.querySelector(".ant-pagination")).toBeNull();
  });

  it("nhiều trang: bấm trang 2 ghi ?page=2", async () => {
    const user = setupUser();
    renderWithAntd(<AdminOrderTable items={[makeOrder()]} total={45} page={1} pageSize={20} />);
    expect(screen.getByText("45 đơn hàng")).toBeInTheDocument();
    await user.click(within(screen.getByTitle("2")).getByRole("button"));
    expect(replace).toHaveBeenCalledWith("/admin/orders?page=2", { scroll: false });
  });
});

describe("AdminOrderToolbar", () => {
  it("ô tìm theo tên khách (✅Q-O1), không có nút thêm", () => {
    renderWithAntd(<AdminOrderToolbar />);
    expect(screen.getByPlaceholderText("Tìm theo tên khách...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thêm/ })).not.toBeInTheDocument();
  });

  it("gõ tìm kiếm ghi ?q sau khi dừng gõ, bỏ trang hiện tại", async () => {
    const user = setupUser();
    search = "page=3";
    renderWithAntd(<AdminOrderToolbar />);
    await user.type(screen.getByRole("textbox", { name: "Tìm theo tên khách" }), "Bình");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/orders?q=B%C3%ACnh", { scroll: false }));
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("chọn trạng thái ghi ?status", async () => {
    const user = setupUser();
    renderWithAntd(<AdminOrderToolbar />);
    await user.click(screen.getByRole("combobox", { name: "Lọc trạng thái" }));
    await user.click(await screen.findByTitle("Đang giao"));
    expect(replace).toHaveBeenCalledWith("/admin/orders?status=shipped", { scroll: false });
  });
});
