import type { AdminProductDetail, AdminProductListItem } from "@/entities/product";
import {
  changedFields,
  columnSortOrder,
  detailToBasicValues,
  emptyBasicValues,
  parseProductListParams,
  parseProductModal,
  rowToBasicValues,
  sortFromTable,
  stockLevel,
} from "./product.rules";

const ID = "bbbbbbbb-0000-4000-8000-000000000101";

describe("stockLevel", () => {
  it("0 là hết hàng, ≤ 5 là sắp hết, còn lại bình thường", () => {
    expect(stockLevel(0)).toBe("out");
    expect(stockLevel(1)).toBe("low");
    expect(stockLevel(5)).toBe("low");
    expect(stockLevel(6)).toBe("ok");
  });
});

describe("sắp xếp qua tiêu đề cột", () => {
  it("map cột + chiều sang ?sort=", () => {
    expect(sortFromTable("price", "ascend")).toBe("price_asc");
    expect(sortFromTable("price", "descend")).toBe("price_desc");
    expect(sortFromTable("rating", "descend")).toBe("rating_desc");
  });

  it("bỏ sắp xếp → undefined (backend mặc định mới nhất)", () => {
    expect(sortFromTable("price", null)).toBeUndefined();
    expect(sortFromTable(undefined, "ascend")).toBeUndefined();
  });

  it("?sort= → chiều đang sắp của từng cột", () => {
    expect(columnSortOrder("price_asc", "price")).toBe("ascend");
    expect(columnSortOrder("price_desc", "price")).toBe("descend");
    expect(columnSortOrder("price_desc", "rating")).toBeNull();
    expect(columnSortOrder("rating_desc", "rating")).toBe("descend");
    expect(columnSortOrder(undefined, "price")).toBeNull();
  });
});

describe("parseProductListParams", () => {
  it("mặc định trang 1, 20 dòng", () => {
    expect(parseProductListParams({})).toEqual({
      search: undefined,
      categoryId: undefined,
      brand: undefined,
      sort: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("đọc đủ tham số hợp lệ", () => {
    expect(
      parseProductListParams({ q: " laptop ", category: ID, brand: "Apple", sort: "price_desc", page: "2", size: "50" }),
    ).toEqual({ search: "laptop", categoryId: ID, brand: "Apple", sort: "price_desc", page: 2, limit: 50 });
  });

  it("bỏ qua giá trị lạ (danh mục không phải UUID, sort lạ, size ngoài 20/50/100)", () => {
    expect(parseProductListParams({ category: "abc", sort: "name", size: "1000", page: "0" })).toMatchObject({
      categoryId: undefined,
      sort: undefined,
      limit: 20,
      page: 1,
    });
  });
});

describe("parseProductModal", () => {
  it("đọc chế độ thêm / sửa; id sai thì không mở", () => {
    expect(parseProductModal({ modal: "create" })).toEqual({ mode: "create" });
    expect(parseProductModal({ modal: "edit", id: ID })).toEqual({ mode: "edit", id: ID });
    expect(parseProductModal({ modal: "edit", id: "x" })).toBeNull();
  });
});

describe("giá trị form", () => {
  const detail: AdminProductDetail = {
    id: ID,
    name: "Tai nghe",
    category_id: null,
    brand: null,
    price: 200_000,
    description: null,
    stock_quantity: 3,
    is_active: true,
    images: [],
    specs: [],
    tags: [],
  };
  const row: AdminProductListItem = {
    id: ID,
    name: "Tai nghe cũ",
    category: "Tai nghe",
    brand: "NexTech",
    price: 150_000,
    rating: null,
    stock_quantity: 0,
    is_active: false,
    created_at: "2026-11-15T14:10:56.793Z",
    thumbnail: null,
  };

  it("thêm mới: danh mục mặc định, giá trống, tồn kho 0, đang bán", () => {
    expect(emptyBasicValues(ID)).toMatchObject({ categoryId: ID, price: undefined, stockQuantity: 0, isActive: true });
  });

  it("sửa đủ dữ liệu: null → rỗng", () => {
    expect(detailToBasicValues(detail)).toEqual({
      name: "Tai nghe",
      categoryId: undefined,
      brand: "",
      price: 200_000,
      description: "",
      stockQuantity: 3,
      isActive: true,
    });
  });

  it("SP ngừng bán: lấy từ dòng list, danh mục và mô tả để trống", () => {
    expect(rowToBasicValues(row)).toMatchObject({ name: "Tai nghe cũ", categoryId: undefined, description: "", isActive: false });
  });

  it("changedFields chỉ giữ trường đã đổi, coi undefined và rỗng là như nhau", () => {
    const initial = rowToBasicValues(row);
    expect(changedFields(initial, { ...initial, isActive: true, description: undefined })).toEqual({ isActive: true });
    expect(changedFields(initial, initial)).toEqual({});
  });
});
