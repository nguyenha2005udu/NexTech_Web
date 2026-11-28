import { render, screen } from "@testing-library/react";
import { makeProduct, renderWithAntd, setupUser } from "@/lib/test-utils";
import { ProductDetailTabs } from "./ProductDetailTabs";
import { ProductGallery } from "./ProductGallery";
import { ProductOverview } from "./ProductOverview";

const specs = [
  { label: "CPU", value: "Intel Core i5" },
  { label: "RAM", value: "16 GB" },
];

describe("ProductDetailTabs", () => {
  it("mặc định mở tab thông số, hiện bảng thông số cạnh phần đánh giá", () => {
    renderWithAntd(<ProductDetailTabs specs={specs} reviewCount={12} reviews={<p>Khối đánh giá</p>} />);
    expect(screen.getByRole("tab", { name: "Thông số kỹ thuật", selected: true })).toBeInTheDocument();
    expect(screen.getByText("Intel Core i5")).toBeInTheDocument();
    expect(screen.getByText("Khối đánh giá")).toBeInTheDocument();
  });

  it("tab Đánh giá hiện số lượng đánh giá", () => {
    renderWithAntd(<ProductDetailTabs specs={specs} reviewCount={12} reviews={null} />);
    expect(screen.getByRole("tab", { name: "Đánh giá (12)" })).toBeInTheDocument();
  });

  it("chuyển sang tab Mô tả thì hiện mô tả", async () => {
    const user = setupUser();
    renderWithAntd(<ProductDetailTabs specs={specs} description="Máy mỏng nhẹ." reviewCount={0} reviews={null} />);
    await user.click(screen.getByRole("tab", { name: "Mô tả" }));
    expect(await screen.findByText("Máy mỏng nhẹ.")).toBeInTheDocument();
  });

  it("chưa có mô tả thì hiện câu thay thế", async () => {
    const user = setupUser();
    renderWithAntd(<ProductDetailTabs specs={specs} reviewCount={0} reviews={null} />);
    await user.click(screen.getByRole("tab", { name: "Mô tả" }));
    expect(await screen.findByText("Nội dung mô tả đang được cập nhật.")).toBeInTheDocument();
  });

  it("chưa có thông số thì báo đang cập nhật thay vì để trống", () => {
    renderWithAntd(<ProductDetailTabs specs={[]} reviewCount={0} reviews={null} />);
    expect(screen.getByText("Thông số kỹ thuật đang được cập nhật.")).toBeInTheDocument();
  });
});

describe("ProductGallery", () => {
  const images = [
    { src: "/a.png", alt: "Mặt trước" },
    { src: "/b.png", alt: "Mặt bên" },
  ];

  it("một ảnh thì không có dải thumbnail", () => {
    render(<ProductGallery images={[images[0]!]} />);
    expect(screen.getByRole("img", { name: "Mặt trước" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Chọn ảnh sản phẩm" })).not.toBeInTheDocument();
  });

  it("nhiều ảnh: ảnh đầu đang chọn, bấm thumbnail đổi ảnh chính", async () => {
    const user = setupUser();
    render(<ProductGallery images={images} />);
    expect(screen.getByRole("button", { name: "Mặt trước" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Mặt bên" }));
    expect(screen.getByRole("button", { name: "Mặt bên" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mặt trước" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("img", { name: "Mặt bên" })).toBeInTheDocument();
  });

  it("không có ảnh nào vẫn render được, có ô báo chưa có ảnh", () => {
    render(<ProductGallery images={[]} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Chưa có ảnh sản phẩm")).toBeInTheDocument();
  });
});

describe("ProductOverview", () => {
  const product = makeProduct({ name: "ASUS Vivobook 15", price: 14_990_000, reviewCount: 12, inStock: true });

  it("hiện tên, giá, số đánh giá và trạng thái còn hàng", () => {
    render(<ProductOverview product={product} />);
    expect(screen.getByRole("heading", { level: 1, name: "ASUS Vivobook 15" })).toBeInTheDocument();
    expect(screen.getByText("14.990.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("12 đánh giá")).toBeInTheDocument();
    expect(screen.getByText("Còn hàng")).toBeInTheDocument();
  });

  it("chưa có đánh giá thì ghi 'Chưa có đánh giá' thay vì điểm 0", () => {
    render(<ProductOverview product={{ ...product, rating: 0, reviewCount: 0 }} />);
    expect(screen.getByText("Chưa có đánh giá")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Đánh giá .* trên 5$/)).not.toBeInTheDocument();
  });

  it("hết hàng thì ghi 'Hết hàng'", () => {
    render(<ProductOverview product={{ ...product, inStock: false }} />);
    expect(screen.getByText("Hết hàng")).toBeInTheDocument();
    expect(screen.queryByText("Còn hàng")).not.toBeInTheDocument();
  });

  it("hiện các slot mua hàng và theo dõi giá do page ghép vào", () => {
    render(<ProductOverview product={product} purchase={<button>Mua ngay</button>} priceAlert={<button>Theo dõi giá</button>} />);
    expect(screen.getByRole("button", { name: "Mua ngay" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theo dõi giá" })).toBeInTheDocument();
  });
});
