import { screen, within } from "@testing-library/react";
import type { AdminPaymentListItem } from "@/entities/transaction";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { TransactionTable } from "./TransactionTable";
import { TransactionToolbar } from "./TransactionToolbar";

const replace = jest.fn();
let search = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: jest.fn() }),
  usePathname: () => "/admin/transactions",
  useSearchParams: () => new URLSearchParams(search),
}));
jest.mock("../actions", () => ({ confirmCodPayment: jest.fn() }));

let seq = 0;
function makePayment(override: Partial<AdminPaymentListItem> = {}): AdminPaymentListItem {
  seq += 1;
  const tail = String(seq).padStart(12, "0");
  return {
    id: `a1b2c3d${seq % 10}-0000-4000-8000-${tail}`,
    order_id: `0rd${seq % 10}e000-0000-4000-8000-${tail}`,
    method: "payos",
    amount: 64_980_000,
    status: "success",
    paid_at: "2026-07-24T03:26:00.000Z",
    ...override,
  };
}

const rowOf = (code: string) => screen.getByRole("row", { name: new RegExp(code) });

beforeEach(() => {
  search = "";
});

describe("TransactionTable", () => {
  it("hiện mã GD dạng PAY-XXXXXXXX, đơn liên kết, phương thức, số tiền, trạng thái, ngày (giờ VN)", () => {
    const p = makePayment({ id: "a1b2c3d4-0000-4000-8000-000000000001", order_id: "e5f6a7b8-0000-4000-8000-000000000001" });
    renderWithAntd(<TransactionTable items={[p]} total={1} page={1} pageSize={20} />);
    const row = rowOf("PAY-A1B2C3D4");
    expect(within(row).getByText("#E5F6A7B8")).toBeInTheDocument();
    expect(within(row).getByText("PayOS")).toBeInTheDocument();
    expect(within(row).getByText("64.980.000 ₫")).toBeInTheDocument();
    expect(within(row).getByText("Thành công")).toBeInTheDocument();
    expect(within(row).getByText("24/07/2026 10:26")).toBeInTheDocument();
  });

  it("link đơn trỏ /admin/orders?view=<order_id> (cùng tab)", () => {
    const p = makePayment({ id: "a1b2c3d4-0000-4000-8000-000000000001", order_id: "e5f6a7b8-0000-4000-8000-000000000001" });
    renderWithAntd(<TransactionTable items={[p]} total={1} page={1} pageSize={20} />);
    const link = within(rowOf("PAY-A1B2C3D4")).getByRole("link", { name: "#E5F6A7B8" });
    expect(link).toHaveAttribute("href", `/admin/orders?view=${p.order_id}`);
    expect(link).not.toHaveAttribute("target");
  });

  it("chỉ dòng COD đang chờ có nút 'Xác nhận đã thu'", () => {
    const items = [
      makePayment({ id: "c0d00001-0000-4000-8000-000000000001", method: "cod", status: "pending", paid_at: null }),
      makePayment({ id: "c0d00002-0000-4000-8000-000000000002", method: "cod", status: "success" }),
      makePayment({ id: "c0d00003-0000-4000-8000-000000000003", method: "payos", status: "pending", paid_at: null }),
      makePayment({ id: "c0d00004-0000-4000-8000-000000000004", method: "cod", status: "failed", paid_at: null }),
    ];
    renderWithAntd(<TransactionTable items={items} total={4} page={1} pageSize={20} />);
    expect(screen.getAllByRole("button", { name: /^Xác nhận đã thu/ })).toHaveLength(1);
    expect(within(rowOf("PAY-C0D00001")).getByRole("button", { name: "Xác nhận đã thu PAY-C0D00001" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Xem giao dịch/ })).toHaveLength(4);
  });

  it("failed → 'Đã huỷ'; refunded → 'Đã hoàn tiền'; pending → 'Chờ thanh toán'; COD tag", () => {
    const items = [
      makePayment({ id: "f0000001-0000-4000-8000-000000000001", status: "failed", method: "cod" }),
      makePayment({ id: "f0000002-0000-4000-8000-000000000002", status: "refunded" }),
      makePayment({ id: "f0000003-0000-4000-8000-000000000003", status: "pending", method: "payos" }),
    ];
    renderWithAntd(<TransactionTable items={items} total={3} page={1} pageSize={20} />);
    expect(within(rowOf("PAY-F0000001")).getByText("Đã huỷ")).toBeInTheDocument();
    expect(within(rowOf("PAY-F0000001")).getByText("COD")).toBeInTheDocument();
    expect(within(rowOf("PAY-F0000002")).getByText("Đã hoàn tiền")).toBeInTheDocument();
    expect(within(rowOf("PAY-F0000003")).getByText("Chờ thanh toán")).toBeInTheDocument();
  });

  it("paid_at null → hiện —", () => {
    const p = makePayment({ id: "d0000001-0000-4000-8000-000000000001", paid_at: null, status: "pending", method: "cod" });
    renderWithAntd(<TransactionTable items={[p]} total={1} page={1} pageSize={20} />);
    expect(within(rowOf("PAY-D0000001")).getByText("—")).toBeInTheDocument();
  });

  it("bấm Xem → ghi ?view=<id> lên URL, giữ bộ lọc", async () => {
    search = "status=pending";
    const user = setupUser();
    const p = makePayment({ id: "b0000001-0000-4000-8000-000000000001" });
    renderWithAntd(<TransactionTable items={[p]} total={1} page={1} pageSize={20} />);
    await user.click(screen.getByRole("button", { name: "Xem giao dịch PAY-B0000001" }));
    expect(replace).toHaveBeenCalledWith(`/admin/transactions?status=pending&view=${p.id}`, { scroll: false });
  });

  it("không có dữ liệu → 'Không có dữ liệu phù hợp'", () => {
    renderWithAntd(<TransactionTable items={[]} total={0} page={1} pageSize={20} />);
    expect(screen.getByText("Không có dữ liệu phù hợp")).toBeInTheDocument();
  });

  it("nhiều trang → hiện tổng và chuyển trang ghi ?page", async () => {
    const user = setupUser();
    const items = Array.from({ length: 20 }, () => makePayment());
    renderWithAntd(<TransactionTable items={items} total={45} page={1} pageSize={20} />);
    expect(screen.getByText("45 giao dịch")).toBeInTheDocument();
    await user.click(within(screen.getByTitle("2")).getByRole("button"));
    expect(replace).toHaveBeenCalledWith("/admin/transactions?page=2", { scroll: false });
  });
});

describe("TransactionToolbar", () => {
  it("mặc định hiện 'Tất cả phương thức' / 'Tất cả trạng thái'", () => {
    renderWithAntd(<TransactionToolbar />);
    expect(screen.getByTitle("Tất cả phương thức")).toBeInTheDocument();
    expect(screen.getByTitle("Tất cả trạng thái")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("chọn phương thức COD → ?method=cod, bỏ ?page", async () => {
    search = "page=3";
    const user = setupUser();
    renderWithAntd(<TransactionToolbar />);
    await user.click(screen.getByRole("combobox", { name: "Lọc phương thức" }));
    await user.click(await screen.findByTitle("COD"));
    expect(replace).toHaveBeenCalledWith("/admin/transactions?method=cod", { scroll: false });
  });

  it("chọn trạng thái 'Đã huỷ' → ?status=failed", async () => {
    const user = setupUser();
    renderWithAntd(<TransactionToolbar />);
    await user.click(screen.getByRole("combobox", { name: "Lọc trạng thái" }));
    await user.click(await screen.findByTitle("Đã huỷ"));
    expect(replace).toHaveBeenCalledWith("/admin/transactions?status=failed", { scroll: false });
  });

  it("đang lọc trạng thái → hiện nhãn tương ứng", () => {
    search = "status=refunded";
    renderWithAntd(<TransactionToolbar />);
    expect(screen.getByTitle("Đã hoàn tiền")).toBeInTheDocument();
  });
});
