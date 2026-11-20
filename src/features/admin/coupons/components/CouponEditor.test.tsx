import { screen, waitFor } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { saveCoupon } from "../actions";
import { emptyCouponValues, type CouponFormValues } from "../coupon.rules";
import { CouponEditor } from "./CouponEditor";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/coupons",
  useSearchParams: () => new URLSearchParams("status=running&modal=create"),
}));
jest.mock("../actions", () => ({ saveCoupon: jest.fn(), toggleCoupon: jest.fn() }));

const mockSave = jest.mocked(saveCoupon);
const ID = "c22e5c86-715a-43a1-b459-cb91ccec43f4";

const editValues: CouponFormValues = {
  code: "SALE10",
  description: "Giảm 10%",
  category: "order",
  discountType: "percent",
  discountValue: 10,
  maxDiscount: 200_000,
  minOrderValue: null,
  usageLimit: 500,
  validFrom: "2026-11-01",
  validUntil: "2026-12-31",
  isActive: true,
};

const field = (name: string) => screen.getByRole("textbox", { name }) as HTMLInputElement;
const spin = (name: string) => screen.getByRole("spinbutton", { name }) as HTMLInputElement;

async function chooseOption(user: ReturnType<typeof setupUser>, label: string, option: string) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByTitle(option));
}

describe("CouponEditor — thêm", () => {
  it("tiêu đề 'Thêm mã giảm giá'; ô Giảm tối đa hiện khi loại %", () => {
    renderWithAntd(<CouponEditor mode="create" initialValues={emptyCouponValues()} />);
    expect(screen.getByText("Thêm mã giảm giá")).toBeInTheDocument();
    expect(spin("Giảm tối đa (không bắt buộc)")).toBeInTheDocument();
    expect(field("Mã")).toBeEnabled();
  });

  it("gõ mã chữ thường tự đổi IN HOA", async () => {
    const user = setupUser();
    renderWithAntd(<CouponEditor mode="create" initialValues={emptyCouponValues()} />);
    await user.type(field("Mã"), "sale10");
    expect(field("Mã")).toHaveValue("SALE10");
  });

  it("đổi loại sang ₫ → hậu tố ₫, ô Giảm tối đa biến mất", async () => {
    const user = setupUser();
    renderWithAntd(<CouponEditor mode="create" initialValues={emptyCouponValues()} />);
    expect(screen.getAllByText("%").length).toBeGreaterThan(0);
    await chooseOption(user, "Loại giảm", "Số tiền (₫)");
    await waitFor(() => expect(screen.queryByRole("spinbutton", { name: "Giảm tối đa (không bắt buộc)" })).not.toBeInTheDocument());
  });

  it("bỏ trống mã và giá trị → báo lỗi, không gọi action", async () => {
    const user = setupUser();
    renderWithAntd(<CouponEditor mode="create" initialValues={emptyCouponValues()} />);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Vui lòng nhập mã")).toBeInTheDocument();
    expect(await screen.findByText("Vui lòng nhập giá trị")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("phần trăm > 100 → báo lỗi", async () => {
    const user = setupUser();
    renderWithAntd(<CouponEditor mode="create" initialValues={{ ...emptyCouponValues(), code: "X", discountValue: 150 }} />);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Phần trăm tối đa 100")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("lưu thành công → gọi saveCoupon(null, …), báo thành công, đóng modal", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: true });
    renderWithAntd(<CouponEditor mode="create" initialValues={emptyCouponValues()} />);
    await user.type(field("Mã"), "sale10");
    await user.type(spin("Giá trị"), "10");
    await user.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ code: "SALE10", discountType: "percent", discountValue: 10, validFrom: undefined }),
      ),
    );
    expect(await screen.findByText("Đã lưu mã giảm giá")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/admin/coupons?status=running", { scroll: false });
  });

  it("mã trùng (lỗi theo ô từ action) → hiện dưới ô Mã, modal vẫn mở", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({
      ok: false,
      message: "Mã giảm giá đã tồn tại",
      fieldErrors: { code: "Mã giảm giá đã tồn tại" },
    });
    renderWithAntd(<CouponEditor mode="create" initialValues={{ ...emptyCouponValues(), code: "SALE10", discountValue: 10 }} />);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Mã giảm giá đã tồn tại")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("CouponEditor — sửa", () => {
  it("ô Mã bị khoá, form đổ dữ liệu dòng (ngày dd/mm/yyyy)", () => {
    renderWithAntd(<CouponEditor mode="edit" couponId={ID} usedCount={124} initialValues={editValues} />);
    expect(screen.getByText("Sửa mã giảm giá")).toBeInTheDocument();
    expect(field("Mã")).toBeDisabled();
    expect(field("Mã")).toHaveValue("SALE10");
    expect(screen.getByDisplayValue("01/11/2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("31/12/2026")).toBeInTheDocument();
  });

  it("giới hạn lượt nhỏ hơn số đã dùng → báo lỗi", async () => {
    const user = setupUser();
    renderWithAntd(<CouponEditor mode="edit" couponId={ID} usedCount={124} initialValues={{ ...editValues, usageLimit: 100 }} />);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Đã dùng 124 lượt — giới hạn phải lớn hơn hoặc bằng")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("lưu → gọi saveCoupon(id, …) với ngày dạng YYYY-MM-DD", async () => {
    const user = setupUser();
    mockSave.mockResolvedValueOnce({ ok: true });
    renderWithAntd(<CouponEditor mode="edit" couponId={ID} usedCount={124} initialValues={editValues} />);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(ID, expect.objectContaining({ validFrom: "2026-11-01", validUntil: "2026-12-31" })),
    );
  });
});

describe("CouponEditor — không tìm thấy", () => {
  it("báo 'Không tìm thấy mã giảm giá', bỏ ?modal, không render modal", async () => {
    renderWithAntd(<CouponEditor mode="missing" />);
    expect(await screen.findByText("Không tìm thấy mã giảm giá")).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/coupons?status=running", { scroll: false }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
