import {
  imageFileError,
  imageUrlSchema,
  productBasicSchema,
  productSpecSchema,
  productTagSchema,
  productUpdateSchema,
  toProductBody,
} from "./schemas";

const CAT = "bbbbbbbb-0000-4000-8000-000000000011";
const valid = { name: "Laptop X", categoryId: CAT, brand: "Apple", price: 34_990_000, description: "", stockQuantity: 12, isActive: true };
const firstMessage = (input: unknown) => productBasicSchema.safeParse(input).error?.issues[0]?.message;

describe("productBasicSchema", () => {
  it("chấp nhận dữ liệu hợp lệ", () => {
    expect(productBasicSchema.safeParse(valid).success).toBe(true);
  });

  it("tên rỗng hoặc toàn khoảng trắng bị từ chối", () => {
    expect(firstMessage({ ...valid, name: "  " })).toBe("Vui lòng nhập tên sản phẩm");
  });

  it("phải chọn danh mục", () => {
    expect(firstMessage({ ...valid, categoryId: undefined })).toBe("Vui lòng chọn danh mục");
  });

  it("giá phải là số nguyên lớn hơn 0", () => {
    expect(firstMessage({ ...valid, price: 0 })).toBe("Giá phải lớn hơn 0");
    expect(firstMessage({ ...valid, price: -5 })).toBe("Giá phải lớn hơn 0");
    expect(firstMessage({ ...valid, price: 10.5 })).toBe("Giá phải là số nguyên");
    expect(firstMessage({ ...valid, price: undefined })).toBe("Vui lòng nhập giá");
  });

  it("tồn kho phải là số nguyên không âm", () => {
    expect(firstMessage({ ...valid, stockQuantity: -1 })).toBe("Tồn kho không được âm");
    expect(productBasicSchema.safeParse({ ...valid, stockQuantity: 0 }).success).toBe(true);
  });

  it("thương hiệu tối đa 100 ký tự", () => {
    expect(firstMessage({ ...valid, brand: "a".repeat(101) })).toBe("Tối đa 100 ký tự");
  });
});

describe("productUpdateSchema", () => {
  it("cho gửi một phần (SP ngừng bán chỉ gửi trường đã đổi)", () => {
    expect(productUpdateSchema.safeParse({ price: 100 }).success).toBe(true);
    expect(productUpdateSchema.safeParse({ price: 0 }).success).toBe(false);
  });
});

describe("toProductBody", () => {
  it("đổi camelCase sang snake_case", () => {
    const input = productBasicSchema.parse({ ...valid, description: "Mỏng nhẹ" });
    expect(toProductBody(input, "create")).toEqual({
      name: "Laptop X",
      category_id: CAT,
      brand: "Apple",
      price: 34_990_000,
      description: "Mỏng nhẹ",
      stock_quantity: 12,
      is_active: true,
    });
  });

  it("thêm mới: thương hiệu / mô tả rỗng thì không gửi", () => {
    const body = toProductBody(productBasicSchema.parse({ ...valid, brand: " ", description: "" }), "create");
    expect(body.brand).toBeUndefined();
    expect(body.description).toBeUndefined();
  });

  it("sửa: gửi chuỗi rỗng để xoá thương hiệu / mô tả cũ", () => {
    const body = toProductBody({ brand: "", description: "" }, "edit");
    expect(body).toMatchObject({ brand: "", description: "" });
  });

  it("sửa một phần: trường không có thì không có trong body", () => {
    expect(JSON.parse(JSON.stringify(toProductBody({ price: 5 }, "edit")))).toEqual({ price: 5 });
  });
});

describe("thông số, tag, ảnh", () => {
  it("thông số cần tên và giá trị; đơn vị tuỳ chọn", () => {
    expect(productSpecSchema.safeParse({ key: "RAM", value: "16", unit: "" }).success).toBe(true);
    expect(productSpecSchema.safeParse({ key: "", value: "16" }).error?.issues[0]?.message).toBe("Nhập tên thông số");
    expect(productSpecSchema.safeParse({ key: "RAM", value: " " }).error?.issues[0]?.message).toBe("Nhập giá trị");
  });

  it("tag được cắt khoảng trắng, không rỗng", () => {
    expect(productTagSchema.parse("  Gaming ")).toBe("Gaming");
    expect(productTagSchema.safeParse("  ").success).toBe(false);
  });

  it("kiểm loại và dung lượng file ảnh như backend", () => {
    expect(imageFileError({ type: "image/png", size: 1000 })).toBeNull();
    expect(imageFileError({ type: "application/pdf", size: 1000 })).toBe("Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF");
    expect(imageFileError({ type: "image/jpeg", size: 5 * 1024 * 1024 + 1 })).toBe("Ảnh tối đa 5MB");
    expect(imageFileError({ type: "image/jpeg", size: 0 })).toBe("File ảnh rỗng");
  });

  it("URL ảnh phải là http/https", () => {
    expect(imageUrlSchema.safeParse("https://cdn.example.com/a.jpg").success).toBe(true);
    expect(imageUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(imageUrlSchema.safeParse("ftp://x.vn/a.jpg").success).toBe(false);
  });
});
