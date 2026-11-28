import { render, screen } from "@testing-library/react";
import { makeProduct } from "@/lib/test-utils";
import { ProductCard } from "./ProductCard";
import { Rating } from "./Rating";

const product = makeProduct({
  slug: "asus-vivobook-15",
  name: "ASUS Vivobook 15",
  summary: "Core i5 · 16 GB RAM",
  price: 14_990_000,
  rating: 4.7,
  tag: "Học tập",
  images: [{ src: "/images/asus.png", alt: "ASUS Vivobook 15 mặt trước" }],
});

describe("ProductCard", () => {
  it("hiện tên, tóm tắt, giá, nhãn và điểm đánh giá", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole("heading", { name: "ASUS Vivobook 15" })).toBeInTheDocument();
    expect(screen.getByText("Core i5 · 16 GB RAM")).toBeInTheDocument();
    expect(screen.getByText("14.990.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("Học tập")).toBeInTheDocument();
    expect(screen.getByLabelText("Đánh giá 4,7 trên 5")).toBeInTheDocument();
  });

  it("cả thẻ là link tới trang chi tiết", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/asus-vivobook-15");
  });

  it("ảnh có alt từ dữ liệu", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole("img", { name: "ASUS Vivobook 15 mặt trước" })).toBeInTheDocument();
  });

  it("sản phẩm chưa có ảnh vẫn render được, không có thẻ img", () => {
    render(<ProductCard product={{ ...product, images: [] }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ASUS Vivobook 15" })).toBeInTheDocument();
  });
});

it("sản phẩm chưa được chấm điểm thì không hiện '★ 0,0'", () => {
  render(<ProductCard product={{ ...product, rating: 0 }} />);
  expect(screen.queryByLabelText(/trên 5$/)).not.toBeInTheDocument();
});

describe("Rating", () => {
  it("định dạng số thập phân kiểu Việt Nam", () => {
    render(<Rating value={4} />);
    expect(screen.getByLabelText("Đánh giá 4,0 trên 5")).toHaveTextContent("4,0");
  });
});
