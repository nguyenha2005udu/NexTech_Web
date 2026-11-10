import type { Category } from "./types";

// "Danh mục nổi bật" theo Figma 01.01; tiêu đề/mô tả trang danh mục theo 01.02.
export const mockCategories: Category[] = [
  {
    id: "c-laptop",
    slug: "laptop",
    name: "Laptop",
    icon: "laptop",
    title: "Laptop học tập & văn phòng",
    description: "Máy gọn nhẹ cho học tập, lập trình và công việc hằng ngày.",
  },
  { id: "c-man-hinh", slug: "man-hinh", name: "Màn hình", icon: "monitor" },
  { id: "c-phu-kien", slug: "phu-kien", name: "Phụ kiện", icon: "keyboard" },
  { id: "c-linh-kien-pc", slug: "linh-kien-pc", name: "Linh kiện PC", icon: "cpu" },
  { id: "c-dien-thoai", slug: "dien-thoai", name: "Điện thoại", icon: "device" },
  { id: "c-thiet-bi-thong-minh", slug: "thiet-bi-thong-minh", name: "Thiết bị thông minh", icon: "sparkle" },
  { id: "c-luu-tru", slug: "luu-tru", name: "Lưu trữ", icon: "storage" },
  { id: "c-mang-ket-noi", slug: "mang-ket-noi", name: "Mạng & kết nối", icon: "network" },
];

/** Thanh điều hướng header (01.02–01.05) */
export const navCategorySlugs = ["laptop", "man-hinh", "linh-kien-pc", "phu-kien"];
