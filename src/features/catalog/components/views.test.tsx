import { render, screen, within } from "@testing-library/react";
import type { Category } from "@/entities/category";
import { makeProduct, renderWithAntd } from "@/lib/test-utils";
import { CategoryProductBrowser } from "./CategoryProductBrowser";
import { CategoryGrid, CommitmentStrip } from "./HomeSections";
import { HomeView } from "./HomeView";
import { ListingView } from "./ListingView";
import { ProductDetailSkeleton } from "./ProductDetailSkeleton";
import { ProductDetailView } from "./ProductDetailView";
import { ProductGrid } from "./ProductGrid";
import { ResultCount } from "./ResultCount";

let currentSearch = "";
jest.mock("next/navigation", () => ({
  usePathname: () => "/categories/laptop",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

beforeEach(() => {
  currentSearch = "";
});

const asus = makeProduct({ id: "p-asus", name: "ASUS Vivobook 15", brand: "ASUS", price: 14_990_000 });
const acer = makeProduct({ id: "p-acer", name: "Acer Aspire 5", brand: "Acer", price: 13_490_000 });
const categories: Category[] = [
  { id: "c-1", slug: "laptop", name: "Laptop", icon: "laptop" },
  { id: "c-2", slug: "man-hinh", name: "Màn hình", icon: "monitor" },
];

describe("ProductGrid", () => {
  it("hiện mỗi sản phẩm một thẻ", () => {
    render(<ProductGrid products={[asus, acer]} />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("danh sách rỗng thì không có thẻ nào", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});

describe("ResultCount", () => {
  it("ghi số sản phẩm đang hiển thị trên tổng", () => {
    render(<ResultCount shown={2} total={9} />);
    expect(screen.getByText("Hiển thị 2 / 9 sản phẩm")).toBeInTheDocument();
  });
});

describe("CategoryProductBrowser", () => {
  it("danh mục chưa có sản phẩm thì báo đang cập nhật", () => {
    render(<CategoryProductBrowser products={[]} />);
    expect(screen.getByRole("heading", { name: "Danh mục đang cập nhật" })).toBeInTheDocument();
  });

  it("không lọc: hiện tất cả sản phẩm kèm số lượng", () => {
    render(<CategoryProductBrowser products={[asus, acer]} />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("Hiển thị 2 / 2 sản phẩm")).toBeInTheDocument();
  });

  it("lọc theo URL ở client: chỉ còn sản phẩm khớp", () => {
    currentSearch = "brand=Acer";
    render(<CategoryProductBrowser products={[asus, acer]} />);
    expect(screen.getByRole("heading", { name: "Acer Aspire 5" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "ASUS Vivobook 15" })).not.toBeInTheDocument();
    expect(screen.getByText("Hiển thị 1 / 2 sản phẩm")).toBeInTheDocument();
  });

  it("sắp xếp theo giá tăng dần", () => {
    currentSearch = "sort=price-asc";
    render(<CategoryProductBrowser products={[asus, acer]} />);
    const names = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["Acer Aspire 5", "ASUS Vivobook 15"]);
  });

  it("lọc không còn kết quả thì hiện trạng thái trống mặc định", () => {
    currentSearch = "brand=Dell";
    render(<CategoryProductBrowser products={[asus, acer]} />);
    expect(screen.getByRole("heading", { name: "Thử từ khóa khác" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});

describe("HomeSections", () => {
  it("CommitmentStrip liệt kê các cam kết mua sắm", () => {
    render(<CommitmentStrip />);
    const strip = screen.getByRole("region", { name: "Cam kết mua sắm" });
    expect(within(strip).getByText("Chính hãng 100%")).toBeInTheDocument();
    expect(within(strip).getByText("Theo dõi giá")).toBeInTheDocument();
  });

  it("CategoryGrid mỗi danh mục là một link tới trang danh mục", () => {
    render(<CategoryGrid categories={categories} />);
    expect(screen.getByRole("link", { name: "Laptop" })).toHaveAttribute("href", "/categories/laptop");
    expect(screen.getByRole("link", { name: "Màn hình" })).toHaveAttribute("href", "/categories/man-hinh");
  });
});

describe("HomeView", () => {
  it("hero dẫn tới danh mục đầu tiên; có danh mục và sản phẩm nổi bật", () => {
    render(<HomeView categories={categories} featured={[asus, acer]} />);
    expect(screen.getByRole("link", { name: /Khám phá ngay/ })).toHaveAttribute("href", "/categories/laptop");
    expect(screen.getByRole("heading", { name: "Danh mục nổi bật" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sản phẩm nổi bật" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Xem tất cả/ })).toHaveAttribute("href", "/search");
  });

  it("chưa có danh mục thì hero dẫn tới trang tìm kiếm", () => {
    render(<HomeView categories={[]} featured={[]} />);
    expect(screen.getByRole("link", { name: /Khám phá ngay/ })).toHaveAttribute("href", "/search");
  });

  it("nút Theo dõi giá ở hero dẫn tới trang cảnh báo giá", () => {
    render(<HomeView categories={[]} featured={[]} />);
    expect(screen.getAllByRole("link", { name: /Theo dõi giá/ })[0]).toHaveAttribute("href", "/account/price-alerts");
  });
});

describe("ListingView", () => {
  it("ghép breadcrumb, tiêu đề, mô tả, bộ lọc, thanh công cụ và nội dung", () => {
    renderWithAntd(
      <ListingView
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Laptop" }]}
        title="Laptop"
        description="Laptop cho sinh viên"
        facets={{ brands: ["ASUS"], rams: [], cpus: [] }}
      >
        <p>Kết quả</p>
      </ListingView>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Laptop" })).toBeInTheDocument();
    expect(screen.getByText("Laptop cho sinh viên")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Bộ lọc sản phẩm" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sắp xếp" })).toBeInTheDocument();
    expect(screen.getByText("Kết quả")).toBeInTheDocument();
  });

  it("không có mô tả thì không hiện đoạn mô tả", () => {
    renderWithAntd(
      <ListingView crumbs={[{ label: "Laptop" }]} title="Laptop" facets={{ brands: [], rams: [], cpus: [] }}>
        <p>Kết quả</p>
      </ListingView>,
    );
    expect(screen.queryByText("Laptop cho sinh viên")).not.toBeInTheDocument();
  });
});

describe("ProductDetailView", () => {
  it("ghép gallery, thông tin, tab và các slot từ page", () => {
    const product = makeProduct({
      name: "ASUS Vivobook 15",
      specs: [{ label: "CPU", value: "Intel Core i5" }],
      images: [{ src: "/a.png", alt: "Ảnh chính" }],
    });
    renderWithAntd(
      <ProductDetailView
        product={product}
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "ASUS Vivobook 15" }]}
        purchase={<button>Mua ngay</button>}
        priceAlert={<button>Theo dõi giá</button>}
        reviews={<p>Khối đánh giá</p>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "ASUS Vivobook 15" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ảnh chính" })).toBeInTheDocument();
    expect(screen.getByText("Intel Core i5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mua ngay" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theo dõi giá" })).toBeInTheDocument();
    expect(screen.getByText("Khối đánh giá")).toBeInTheDocument();
  });
});

describe("ProductDetailSkeleton", () => {
  it("báo trạng thái đang tải", () => {
    render(<ProductDetailSkeleton />);
    expect(screen.getByLabelText("Đang tải sản phẩm")).toHaveAttribute("aria-busy", "true");
  });
});
