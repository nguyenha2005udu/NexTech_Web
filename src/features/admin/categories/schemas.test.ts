import { categoryFormSchema, categoryIdSchema } from "./schemas";

const valid = { name: "Laptop", icon: "💻", sortOrder: 1, industryId: undefined, isActive: true };
const firstMessage = (input: unknown) => categoryFormSchema.safeParse(input).error?.issues[0]?.message;

describe("categoryFormSchema", () => {
  it("chấp nhận dữ liệu hợp lệ và cắt khoảng trắng ở tên", () => {
    const result = categoryFormSchema.parse({ ...valid, name: "  Laptop  " });
    expect(result.name).toBe("Laptop");
  });

  it("báo lỗi khi tên rỗng hoặc chỉ có khoảng trắng", () => {
    expect(firstMessage({ ...valid, name: "" })).toBe("Vui lòng nhập tên danh mục");
    expect(firstMessage({ ...valid, name: "   " })).toBe("Vui lòng nhập tên danh mục");
    expect(firstMessage({ ...valid, name: undefined })).toBe("Vui lòng nhập tên danh mục");
  });

  it("báo lỗi khi tên dài quá 100 ký tự", () => {
    expect(firstMessage({ ...valid, name: "a".repeat(101) })).toBe("Tối đa 100 ký tự");
    expect(categoryFormSchema.safeParse({ ...valid, name: "a".repeat(100) }).success).toBe(true);
  });

  it("thứ tự phải là số nguyên không âm", () => {
    expect(firstMessage({ ...valid, sortOrder: -1 })).toBe("Thứ tự không được âm");
    expect(firstMessage({ ...valid, sortOrder: 1.5 })).toBe("Thứ tự phải là số nguyên");
    expect(firstMessage({ ...valid, sortOrder: null })).toBe("Vui lòng nhập thứ tự hiển thị");
    expect(categoryFormSchema.safeParse({ ...valid, sortOrder: 0 }).success).toBe(true);
  });

  it("icon rỗng hợp lệ và được gửi là null để xoá icon cũ", () => {
    expect(categoryFormSchema.parse({ ...valid, icon: "" }).icon).toBeNull();
    expect(categoryFormSchema.parse({ ...valid, icon: "   " }).icon).toBeNull();
    expect(categoryFormSchema.parse({ ...valid, icon: undefined }).icon).toBeNull();
  });

  it("icon dài quá 500 ký tự bị từ chối", () => {
    expect(firstMessage({ ...valid, icon: "x".repeat(501) })).toBe("Tối đa 500 ký tự");
  });

  it("bỏ trống ngành học → null; ngành học sai định dạng bị từ chối", () => {
    expect(categoryFormSchema.parse(valid).industryId).toBeNull();
    expect(firstMessage({ ...valid, industryId: "abc" })).toBe("Ngành học không hợp lệ");
    expect(categoryFormSchema.parse({ ...valid, industryId: "bbbbbbbb-0000-4000-8000-000000000001" }).industryId).toBe(
      "bbbbbbbb-0000-4000-8000-000000000001",
    );
  });
});

describe("categoryIdSchema", () => {
  it("chỉ nhận UUID", () => {
    expect(categoryIdSchema.safeParse("bbbbbbbb-0000-4000-8000-000000000011").success).toBe(true);
    expect(categoryIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });
});
