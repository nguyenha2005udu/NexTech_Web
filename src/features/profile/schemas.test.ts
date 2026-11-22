import { profileFormSchema, toAccountBody, toShoppingBody } from "./schemas";

const valid = { fullName: "Nguyễn Văn A", phone: "0901234567", userSegment: "Sinh viên", occupation: "CNTT", ageRange: "18-22", interests: ["laptop"] };

describe("profileFormSchema", () => {
  it("chấp nhận dữ liệu hợp lệ", () => {
    expect(profileFormSchema.safeParse(valid).success).toBe(true);
  });

  it("cho phép bỏ trống số điện thoại và các ô hồ sơ mua sắm", () => {
    const r = profileFormSchema.safeParse({ fullName: "Nguyễn Văn A" });
    expect(r.success && r.data).toMatchObject({ phone: "", interests: [] });
  });

  it.each(["abc", "123", "0901-234-567"])("từ chối số điện thoại sai: %s", (phone) => {
    expect(profileFormSchema.safeParse({ ...valid, phone }).success).toBe(false);
  });

  it("từ chối họ tên ngắn hơn 2 ký tự và dài hơn 150 ký tự", () => {
    expect(profileFormSchema.safeParse({ ...valid, fullName: "A" }).success).toBe(false);
    expect(profileFormSchema.safeParse({ ...valid, fullName: "A".repeat(151) }).success).toBe(false);
  });

  it("từ chối ô vượt giới hạn backend: segment 50, occupation 100, age 20", () => {
    expect(profileFormSchema.safeParse({ ...valid, userSegment: "x".repeat(51) }).success).toBe(false);
    expect(profileFormSchema.safeParse({ ...valid, occupation: "x".repeat(101) }).success).toBe(false);
    expect(profileFormSchema.safeParse({ ...valid, ageRange: "x".repeat(21) }).success).toBe(false);
  });

  it("cắt khoảng trắng đầu/cuối họ tên", () => {
    const r = profileFormSchema.safeParse({ ...valid, fullName: "  Nguyễn Văn A  " });
    expect(r.success && r.data.fullName).toBe("Nguyễn Văn A");
  });
});

describe("toAccountBody / toShoppingBody", () => {
  it("đổi sang snake_case của backend", () => {
    const v = profileFormSchema.parse(valid);
    expect(toAccountBody(v)).toEqual({ full_name: "Nguyễn Văn A", phone_number: "0901234567" });
    expect(toShoppingBody(v)).toEqual({ user_segment: "Sinh viên", occupation: "CNTT", age_range: "18-22", interests: ["laptop"] });
  });

  it("bỏ khỏi body các ô trống để không ghi đè giá trị cũ", () => {
    const v = profileFormSchema.parse({ fullName: "Nguyễn Văn A", phone: "", userSegment: null, occupation: "", ageRange: undefined });
    expect(toAccountBody(v)).toEqual({ full_name: "Nguyễn Văn A" });
    expect(toShoppingBody(v)).toEqual({ interests: [] });
  });
});
