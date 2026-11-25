import { render, screen } from "@testing-library/react";
import type { Review } from "@/entities/review";
import { reviewService } from "@/entities/review/service";
import { ReviewSummary, ReviewSummarySkeleton } from "./ReviewSummary";

jest.mock("@/entities/review/service", () => ({ reviewService: { listByProduct: jest.fn() } }));
const mockList = jest.mocked(reviewService.listByProduct);

const review = (override: Partial<Review> = {}): Review => ({
  id: "r-1",
  productId: "p-1",
  authorLabel: "Người mua đã xác minh",
  rating: 5,
  content: "Máy chạy mượt.",
  createdAt: "2026-11-01T09:00:00.000Z",
  ...override,
});

/** ReviewSummary là Server Component async → gọi như hàm rồi render JSX trả về. */
async function renderSummary(props = { productId: "p-1", rating: 4.7, reviewCount: 12 }) {
  render(await ReviewSummary(props));
}

afterEach(() => jest.clearAllMocks());

describe("ReviewSummary", () => {
  it("lấy đánh giá theo sản phẩm", async () => {
    mockList.mockResolvedValue([]);
    await renderSummary({ productId: "p-9", rating: 4, reviewCount: 1 });
    expect(mockList).toHaveBeenCalledWith("p-9");
  });

  it("hiện điểm trung bình và tổng số đánh giá", async () => {
    mockList.mockResolvedValue([review()]);
    await renderSummary();
    expect(screen.getByText("4,7 / 5 · 12 đánh giá")).toBeInTheDocument();
  });

  it("hiện từng đánh giá: tác giả, số sao, ngày và nội dung", async () => {
    mockList.mockResolvedValue([review(), review({ id: "r-2", rating: 3, content: "Tạm ổn.", authorLabel: "Minh A", createdAt: "2026-11-05T09:00:00.000Z" })]);
    await renderSummary();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByLabelText("5 trên 5 sao")).toBeInTheDocument();
    expect(screen.getByLabelText("3 trên 5 sao")).toBeInTheDocument();
    expect(screen.getByText("Minh A")).toBeInTheDocument();
    expect(screen.getByText("01/11/2026")).toHaveAttribute("datetime", "2026-11-01T09:00:00.000Z");
    expect(screen.getByText("05/11/2026")).toHaveAttribute("datetime", "2026-11-05T09:00:00.000Z");
    expect(screen.getByText("Tạm ổn.")).toBeInTheDocument();
  });

  it("chưa có đánh giá thì hiện câu thay thế, không có danh sách", async () => {
    mockList.mockResolvedValue([]);
    await renderSummary();
    expect(screen.getByText("Chưa có đánh giá nào cho sản phẩm này.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("ReviewSummarySkeleton", () => {
  it("báo trạng thái đang tải cho trình đọc màn hình", () => {
    render(<ReviewSummarySkeleton />);
    expect(screen.getByLabelText("Đang tải đánh giá")).toHaveAttribute("aria-busy", "true");
  });
});
