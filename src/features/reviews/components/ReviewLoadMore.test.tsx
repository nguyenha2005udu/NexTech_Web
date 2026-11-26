import { screen, waitFor } from "@testing-library/react";
import type { Review, ReviewPage } from "@/entities/review";
import { renderWithProviders, setupUser } from "@/lib/test-utils";
import { ReviewLoadMore } from "./ReviewLoadMore";

const review = (id: string, content: string): Review => ({
  id,
  productId: "p-1",
  authorLabel: "Người mua đã xác minh",
  rating: 4,
  content,
  createdAt: "2026-11-03T09:00:00.000Z",
});

let fetchMock: jest.Mock;
const respond = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => jest.clearAllMocks());

const urlOf = (call: number) => String((fetchMock.mock.calls[call]?.[0] as Request).url);

describe("ReviewLoadMore", () => {
  it("hết đánh giá thì không có nút", () => {
    renderWithProviders(<ReviewLoadMore productId="p-1" loaded={3} total={3} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("còn đánh giá thì nút ghi số còn lại", () => {
    renderWithProviders(<ReviewLoadMore productId="p-1" loaded={3} total={8} />);
    expect(screen.getByRole("button", { name: "Xem thêm đánh giá (5)" })).toBeInTheDocument();
  });

  it("bấm thì tải trang 2, nối thêm đánh giá và cập nhật số còn lại", async () => {
    const page: ReviewPage = { items: [review("r-4", "Đóng gói kỹ."), review("r-5", "Giao nhanh.")], page: 2, total: 8 };
    fetchMock.mockImplementation(() => respond(page));
    const user = setupUser();
    renderWithProviders(<ReviewLoadMore productId="p-1" loaded={3} total={8} />);

    await user.click(screen.getByRole("button", { name: /Xem thêm đánh giá/ }));
    expect(await screen.findByText("Đóng gói kỹ.")).toBeInTheDocument();
    expect(screen.getByText("Giao nhanh.")).toBeInTheDocument();
    expect(urlOf(0)).toContain("/api/products/p-1/reviews");
    expect(urlOf(0)).toContain("page=2");
    // Nút còn ở trạng thái loading (có icon) ngay sau khi nối đánh giá → chờ tên nút ổn định.
    expect(await screen.findByRole("button", { name: "Xem thêm đánh giá (3)" })).toBeInTheDocument();
  });

  it("tải hết thì ẩn nút; lần bấm tiếp theo gọi trang 3", async () => {
    fetchMock
      .mockImplementationOnce(() => respond({ items: [review("r-4", "A")], page: 2, total: 5 }))
      .mockImplementationOnce(() => respond({ items: [review("r-5", "B")], page: 3, total: 5 }));
    const user = setupUser();
    renderWithProviders(<ReviewLoadMore productId="p-1" loaded={3} total={5} />);

    await user.click(screen.getByRole("button", { name: /Xem thêm đánh giá/ }));
    await screen.findByText("A");
    await user.click(screen.getByRole("button", { name: /Xem thêm đánh giá/ }));
    await screen.findByText("B");
    expect(urlOf(1)).toContain("page=3");
    await waitFor(() => expect(screen.queryByRole("button")).not.toBeInTheDocument());
  });

  it("lỗi mạng thì báo lỗi và cho thử lại, không mất đánh giá đã có", async () => {
    fetchMock.mockImplementationOnce(() => respond({ message: "boom" }, 500));
    const user = setupUser();
    renderWithProviders(<ReviewLoadMore productId="p-1" loaded={3} total={8} />);

    await user.click(screen.getByRole("button", { name: /Xem thêm đánh giá/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được thêm đánh giá");

    fetchMock.mockImplementationOnce(() => respond({ items: [review("r-4", "Tốt.")], page: 2, total: 8 }));
    const retry = await screen.findByRole("button", { name: /Thử lại/ });
    await waitFor(() => expect(retry).not.toHaveClass("ant-btn-loading"));
    await user.click(retry);
    expect(await screen.findByText("Tốt.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("productId có ký tự đặc biệt được mã hoá trong URL", async () => {
    fetchMock.mockImplementation(() => respond({ items: [], page: 2, total: 4 }));
    const user = setupUser();
    renderWithProviders(<ReviewLoadMore productId="a/b" loaded={3} total={4} />);
    await user.click(screen.getByRole("button", { name: /Xem thêm đánh giá/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(urlOf(0)).toContain("/products/a%2Fb/reviews");
  });
});
