import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OverviewStats } from "@/entities/statistics";
import { mockOverview, mockRevenueItems } from "@/entities/statistics/mock-data";
import { mockAdminOrders } from "@/entities/order/mock-data";
import { DashboardView } from "./DashboardView";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function renderDashboard(overview: Partial<OverviewStats> = {}, orders = mockAdminOrders) {
  return render(
    <DashboardView
      overview={{ ...mockOverview, ...overview }}
      revenue={mockRevenueItems(2026)}
      year={2026}
      latestOrders={orders}
    />,
  );
}

describe("DashboardView", () => {
  it("hiện 4 thẻ số liệu đã định dạng", () => {
    renderDashboard();
    expect(screen.getByText("Tổng đơn hàng").nextSibling).toHaveTextContent("1.240");
    expect(screen.getByText("Doanh thu").nextSibling).toHaveTextContent("2,45 tỷ ₫");
    expect(screen.getByText("Số sản phẩm").nextSibling).toHaveTextContent("18");
    expect(screen.getByText("Người dùng").nextSibling).toHaveTextContent("8.320");
  });

  it("thẻ thiếu dữ liệu hiện dấu — và cảnh báo đầu trang", () => {
    renderDashboard({ total_revenue: null, unavailable: ["payment"] });
    expect(screen.getByLabelText("Chưa lấy được dữ liệu")).toHaveTextContent("—");
    expect(screen.getByText("Một số số liệu tạm thời chưa lấy được")).toBeInTheDocument();
  });

  it("không hiện cảnh báo khi đủ dữ liệu", () => {
    renderDashboard();
    expect(screen.queryByText("Một số số liệu tạm thời chưa lấy được")).not.toBeInTheDocument();
  });

  it("chạy được khi backend không trả trường unavailable (monolith be/)", () => {
    renderDashboard({ unavailable: undefined });
    expect(screen.getByText("Tổng đơn hàng")).toBeInTheDocument();
    expect(screen.queryByText("Một số số liệu tạm thời chưa lấy được")).not.toBeInTheDocument();
  });

  it("đơn không còn tên khách hiện dấu —", () => {
    const first = mockAdminOrders[0];
    if (!first) throw new Error("thiếu dữ liệu mẫu");
    renderDashboard({}, [{ ...first, user_name: null }]);
    const row = screen.getByRole("row", { name: /#A1B2C3D4/ });
    expect(within(row).getByText("—")).toBeInTheDocument();
  });

  it("biểu đồ có 12 cột đọc được bằng trình đọc màn hình", () => {
    renderDashboard();
    const chart = screen.getByRole("list", { name: "Doanh thu theo tháng năm 2026" });
    expect(within(chart).getAllByRole("img")).toHaveLength(12);
    expect(within(chart).getByRole("img", { name: "Tháng 1: 92.000.000 ₫" })).toBeInTheDocument();
  });

  it("năm chưa có doanh thu thì hiện chữ thông báo", () => {
    render(<DashboardView overview={mockOverview} revenue={[]} year={2027} latestOrders={[]} />);
    expect(screen.getByText("Chưa có doanh thu trong năm 2027")).toBeInTheDocument();
  });

  it("bảng đơn mới nhất hiện mã rút gọn, tiền và nhãn trạng thái", () => {
    renderDashboard();
    const row = screen.getByRole("row", { name: /#A1B2C3D4/ });
    expect(within(row).getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(within(row).getByText("64.980.000 ₫")).toBeInTheDocument();
    expect(within(row).getByText("Đã thanh toán")).toBeInTheDocument();
    expect(within(row).getByText("24/07/2026 10:24")).toBeInTheDocument();
  });

  it("mã đơn là link mở chi tiết ở màn Đơn hàng", () => {
    renderDashboard();
    expect(screen.getByRole("link", { name: "#A1B2C3D4" })).toHaveAttribute(
      "href",
      `/admin/orders?view=${mockAdminOrders[0]?.id}`,
    );
  });

  it("bấm vào dòng chuyển sang chi tiết đơn", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(screen.getByText("Trần Thị B"));
    expect(push).toHaveBeenCalledWith(`/admin/orders?view=${mockAdminOrders[1]?.id}`);
  });

  it("không có đơn thì hiện 'Chưa có đơn hàng'", () => {
    renderDashboard({}, []);
    expect(screen.getByText("Chưa có đơn hàng")).toBeInTheDocument();
  });
});
