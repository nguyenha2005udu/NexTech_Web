import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders, setupUser } from "@/lib/test-utils";
import { createReview } from "../actions";
import { ReviewButton } from "./ReviewButton";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
jest.mock("../actions", () => ({ createReview: jest.fn() }));
const mockCreate = jest.mocked(createReview);

afterEach(() => jest.clearAllMocks());

async function openDialog() {
  const user = setupUser();
  renderWithProviders(<ReviewButton orderId="o-1" productId="p-asus" productName="ASUS Vivobook 15" />);
  await user.click(screen.getByRole("button", { name: "Viết đánh giá" }));
  const dialog = await screen.findByRole("dialog", { name: "Đánh giá ASUS Vivobook 15" });
  return { user, dialog };
}

describe("ReviewButton", () => {
  it("mở hộp thoại có chọn sao và ô nội dung", async () => {
    const { dialog } = await openDialog();
    expect(within(dialog).getAllByRole("radio")).toHaveLength(5);
    expect(within(dialog).getByRole("textbox", { name: "Nội dung đánh giá" })).toBeInTheDocument();
  });

  it("gửi số sao và nội dung, rồi đóng hộp thoại và làm mới trang", async () => {
    mockCreate.mockResolvedValue({ ok: true, data: { reviewId: "r-1" } });
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getAllByRole("radio")[3]!); // 4 sao
    await user.type(within(dialog).getByRole("textbox", { name: "Nội dung đánh giá" }), "Máy chạy mượt, đáng tiền.");
    await user.click(within(dialog).getByRole("button", { name: "Gửi đánh giá" }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        orderId: "o-1",
        productId: "p-asus",
        rating: 4,
        content: "Máy chạy mượt, đáng tiền.",
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("lỗi theo ô từ server hiện đúng chỗ, hộp thoại vẫn mở", async () => {
    mockCreate.mockResolvedValue({
      ok: false,
      message: "Nội dung tối thiểu 10 ký tự",
      fieldErrors: { content: "Nội dung tối thiểu 10 ký tự", rating: "Chọn số sao" },
    });
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getByRole("button", { name: "Gửi đánh giá" }));
    expect(await within(dialog).findByText("Nội dung tối thiểu 10 ký tự")).toBeInTheDocument();
    expect(within(dialog).getByText("Chọn số sao")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("lỗi chung (đã đánh giá rồi…) hiện trong hộp thoại", async () => {
    mockCreate.mockResolvedValue({ ok: false, message: "Bạn đã đánh giá sản phẩm này rồi" });
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getByRole("button", { name: "Gửi đánh giá" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Bạn đã đánh giá sản phẩm này rồi");
    expect(refresh).not.toHaveBeenCalled();
  });
});
