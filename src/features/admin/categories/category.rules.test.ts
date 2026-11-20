import type { AdminCategory } from "@/entities/category";
import {
  emptyFormValues,
  isImageIcon,
  nextSortOrder,
  parseCategoryListParams,
  parseCategoryModal,
  toFormValues,
} from "./category.rules";

const ID = "bbbbbbbb-0000-4000-8000-000000000011";

describe("nextSortOrder", () => {
  it("danh sách rỗng → 1", () => {
    expect(nextSortOrder([], 0)).toBe(1);
  });

  it("lấy thứ tự lớn nhất + 1, không phải số dòng + 1", () => {
    expect(nextSortOrder([{ sortOrder: 2 }, { sortOrder: 9 }, { sortOrder: 4 }], 3)).toBe(10);
  });

  it("còn danh mục chưa lấy hết (total > số đã lấy) → total + 1", () => {
    expect(nextSortOrder([{ sortOrder: 3 }], 150)).toBe(151);
  });
});

describe("isImageIcon", () => {
  it("nhận URL http/https là ảnh", () => {
    expect(isImageIcon("https://cdn.example.com/a.png")).toBe(true);
    expect(isImageIcon(" http://x.vn/i.svg ")).toBe(true);
  });

  it("emoji, chữ, rỗng không phải ảnh", () => {
    expect(isImageIcon("💻")).toBe(false);
    expect(isImageIcon("laptop")).toBe(false);
    expect(isImageIcon(null)).toBe(false);
  });
});

describe("parseCategoryListParams", () => {
  it("mặc định trang 1, 20 dòng, không lọc", () => {
    expect(parseCategoryListParams({})).toEqual({ search: undefined, isActive: undefined, page: 1, limit: 20 });
  });

  it("đổi ?status thành isActive và cắt khoảng trắng từ khoá", () => {
    expect(parseCategoryListParams({ q: "  tai nghe ", status: "hidden", page: "3" })).toMatchObject({
      search: "tai nghe",
      isActive: false,
      page: 3,
    });
    expect(parseCategoryListParams({ status: "active" }).isActive).toBe(true);
  });

  it("bỏ qua giá trị lạ", () => {
    expect(parseCategoryListParams({ status: "xyz", page: "-2", q: "   " })).toMatchObject({
      search: undefined,
      isActive: undefined,
      page: 1,
    });
  });
});

describe("parseCategoryModal", () => {
  it("đọc chế độ thêm và sửa", () => {
    expect(parseCategoryModal({ modal: "create" })).toEqual({ mode: "create" });
    expect(parseCategoryModal({ modal: "edit", id: ID })).toEqual({ mode: "edit", id: ID });
  });

  it("sửa thiếu id hoặc id sai định dạng → không mở", () => {
    expect(parseCategoryModal({ modal: "edit" })).toBeNull();
    expect(parseCategoryModal({ modal: "edit", id: "1" })).toBeNull();
    expect(parseCategoryModal({})).toBeNull();
  });
});

describe("giá trị form", () => {
  const category: AdminCategory = {
    id: ID,
    name: "Tai nghe",
    icon: null,
    sortOrder: 5,
    isActive: false,
    createdAt: "2026-11-15T14:10:56.793Z",
    industry_id: null,
  };

  it("form sửa đổ sẵn giá trị danh mục", () => {
    expect(toFormValues(category)).toEqual({ name: "Tai nghe", icon: "", sortOrder: 5, industryId: undefined, isActive: false });
  });

  it("form thêm mặc định hiển thị, thứ tự do page tính", () => {
    expect(emptyFormValues(9)).toEqual({ name: "", icon: "", sortOrder: 9, industryId: undefined, isActive: true });
  });
});
