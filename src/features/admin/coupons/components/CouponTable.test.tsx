import { screen, waitFor, within } from "@testing-library/react";
import type { AdminCoupon } from "@/entities/coupon";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { toggleCoupon } from "../actions";
import { CouponTable } from "./CouponTable";
import { CouponToolbar } from "./CouponToolbar";

const replace = jest.fn();
let search = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/coupons",
  useSearchParams: () => new URLSearchParams(search),
}));
jest.mock("../actions", () => ({ toggleCoupon: jest.fn(), saveCoupon: jest.fn() }));

const mockToggle = jest.mocked(toggleCoupon);
const NOW = "2026-11-20T05:00:00.000Z";

let seq = 0;
function makeCoupon(override: Partial<AdminCoupon> = {}): AdminCoupon {
  seq += 1;
  return {
    id: `c22e5c86-715a-43a1-b459-${String(seq).padStart(12, "0")}`,
    code: `MA${seq}`,
    description: "Giảm 10% toàn bộ",
    category: "order",
    discount_type: "percent",
    discount_value: 10,
    min_order_value: null,
    max_discount: null,
    usage_limit: 500,
    used_count: 124,
    valid_from: null,
    valid_until: "2026-12-31T16:59:59.000Z",
    is_active: true,
    status: "running",
    ...override,
  };
}

const renderTable = (items: AdminCoupon[], total = items.length) =>
  renderWithAntd(<CouponTable items={items} total={total} page={1} pageSize={20} now={NOW} />);

beforeEach(() => {
  search = "";
});

describe("CouponTable", () => {
  it("hiện mã, mô tả, loại, giá trị, đã dùng, HSD (giờ VN) và trạng thái", () => {
    renderTable([makeCoupon({ code: "SALE10" })]);
    const row = screen.getByRole("row", { name: /SALE10/ });
    expect(within(row).getByText("Giảm 10% toàn bộ")).toBeInTheDocument();
    expect(within(row).getByText("%")).toBeInTheDocument();
    expect(within(row).getByText("10%")).toBeInTheDocument();
    expect(within(row).getByText("124/500")).toBeInTheDocument();
    expect(within(row).getByText("31/12/2026")).toBeInTheDocument();
    expect(within(row).getByText("Đang chạy")).toBeInTheDocument();
  });

  it("usage_limit null → x/∞; valid_until null → 'Không hạn'; mô tả null → —; loại ₫", () => {
    renderTable([
      makeCoupon({
        code: "FREESHIP",
        usage_limit: null,
        used_count: 512,
        valid_until: null,
        description: null,
        discount_type: "fixed_amount",
        discount_value: 30_000,
      }),
    ]);
    const row = screen.getByRole("row", { name: /FREESHIP/ });
    expect(within(row).getByText("512/∞")).toBeInTheDocument();
    expect(within(row).getByText("Không hạn")).toBeInTheDocument();
    expect(within(row).getByText("—")).toBeInTheDocument();
    expect(within(row).getByText("₫")).toBeInTheDocument();
    expect(within(row).getByText("30.000₫")).toBeInTheDocument();
  });

  it("mã hết hạn hiện 'Hết hạn'; mã tương lai 'Chưa bắt đầu'; mã tắt 'Tạm dừng'", () => {
    renderTable([
      makeCoupon({ code: "NEW2026", valid_until: "2026-03-01T00:00:00.000Z", status: "paused" }),
      makeCoupon({ code: "TET2027", valid_from: "2027-01-20T00:00:00.000Z", valid_until: null, status: "paused" }),
      makeCoupon({ code: "OFF", is_active: false, status: "paused" }),
    ]);
    expect(within(screen.getByRole("row", { name: /NEW2026/ })).getByText("Hết hạn")).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /TET2027/ })).getByText("Chưa bắt đầu")).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /OFF/ })).getByText("Tạm dừng", { selector: ".ant-tag" })).toBeInTheDocument();
  });

  it("mã đang bật có 'Tạm dừng', mã tắt có 'Kích hoạt'; không có 'Xoá'", () => {
    renderTable([makeCoupon({ code: "ON" }), makeCoupon({ code: "OFF", is_active: false })]);
    const on = screen.getByRole("row", { name: /ON/ });
    const off = screen.getByRole("row", { name: /OFF/ });
    expect(within(on).getByRole("button", { name: "Tạm dừng" })).toBeInTheDocument();
    expect(within(off).getByRole("button", { name: "Kích hoạt" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xoá" })).not.toBeInTheDocument();
  });

  it("bấm Sửa mở modal sửa qua URL", async () => {
    const user = setupUser();
    const coupon = makeCoupon();
    renderTable([coupon]);
    await user.click(screen.getByRole("button", { name: "Sửa" }));
    expect(replace).toHaveBeenCalledWith(`/admin/coupons?modal=edit&id=${coupon.id}`, { scroll: false });
  });

  it("Tạm dừng: hỏi xác nhận, đồng ý thì gọi toggleCoupon(id, false) và báo thành công", async () => {
    const user = setupUser();
    mockToggle.mockResolvedValueOnce({ ok: true });
    const coupon = makeCoupon({ code: "SALE10" });
    renderTable([coupon]);

    await user.click(screen.getByRole("button", { name: "Tạm dừng" }));
    const dialog = (await screen.findByText("Khách sẽ không dùng được mã này.")).closest(".ant-popover") as HTMLElement;
    expect(within(dialog).getByText("Tạm dừng mã SALE10?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Tạm dừng" }));
    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith(coupon.id, false));
    expect(await screen.findByText("Đã tạm dừng mã")).toBeInTheDocument();
  });

  it("Kích hoạt: gọi toggleCoupon(id, true); lỗi thì hiện câu backend", async () => {
    const user = setupUser();
    mockToggle.mockResolvedValueOnce({ ok: false, message: "Không tìm thấy mã giảm giá" });
    const coupon = makeCoupon({ code: "OFF", is_active: false });
    renderTable([coupon]);

    await user.click(screen.getByRole("button", { name: "Kích hoạt" }));
    const dialog = (await screen.findByText("Kích hoạt lại mã OFF?")).closest(".ant-popover") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Kích hoạt" }));
    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith(coupon.id, true));
    expect(await screen.findByText("Không tìm thấy mã giảm giá")).toBeInTheDocument();
  });

  it("rỗng → thông báo, không phân trang; nhiều trang → bấm trang 2", async () => {
    const user = setupUser();
    const { unmount } = renderTable([]);
    expect(screen.getByText("Không có dữ liệu phù hợp")).toBeInTheDocument();
    unmount();

    renderTable([makeCoupon()], 32);
    expect(screen.getByText("32 mã")).toBeInTheDocument();
    await user.click(within(screen.getByTitle("2")).getByRole("button"));
    expect(replace).toHaveBeenCalledWith("/admin/coupons?page=2", { scroll: false });
  });
});

describe("CouponToolbar", () => {
  it("bấm Thêm mã mở modal thêm, giữ bộ lọc", async () => {
    const user = setupUser();
    search = "status=paused";
    renderWithAntd(<CouponToolbar />);
    await user.click(screen.getByRole("button", { name: /Thêm mã/ }));
    expect(replace).toHaveBeenCalledWith("/admin/coupons?status=paused&modal=create", { scroll: false });
  });

  it("gõ tìm ghi ?q sau khi dừng gõ", async () => {
    const user = setupUser();
    renderWithAntd(<CouponToolbar />);
    await user.type(screen.getByRole("textbox", { name: "Tìm mã" }), "SALE");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/coupons?q=SALE", { scroll: false }));
  });

  it("chọn trạng thái ghi ?status", async () => {
    const user = setupUser();
    renderWithAntd(<CouponToolbar />);
    await user.click(screen.getByRole("combobox", { name: "Lọc trạng thái" }));
    await user.click(await screen.findByTitle("Đang chạy"));
    expect(replace).toHaveBeenCalledWith("/admin/coupons?status=running", { scroll: false });
  });
});
