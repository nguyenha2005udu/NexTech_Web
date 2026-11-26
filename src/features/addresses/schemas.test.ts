import { addressFormSchema, toAddressBody } from "./schemas";

const valid = { recipientName: "  Minh Anh ", phoneNumber: "090 123 4567", fullAddress: "123 Nguyễn Văn Cừ, Q5", isDefault: false };

describe("addressFormSchema", () => {
  it("cắt khoảng trắng và nhận dữ liệu hợp lệ", () => {
    expect(addressFormSchema.parse(valid).recipientName).toBe("Minh Anh");
  });

  it.each([
    ["tên quá ngắn", { recipientName: "A" }, "recipientName"],
    ["số điện thoại sai", { phoneNumber: "abc" }, "phoneNumber"],
    ["địa chỉ quá ngắn", { fullAddress: "x" }, "fullAddress"],
    ["địa chỉ quá dài", { fullAddress: "x".repeat(256) }, "fullAddress"],
  ])("từ chối khi %s", (_label, override, field) => {
    const result = addressFormSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe(field);
  });

  it("isDefault mặc định là false", () => {
    expect(addressFormSchema.parse({ ...valid, isDefault: undefined }).isDefault).toBe(false);
  });
});

describe("toAddressBody", () => {
  it("không gửi is_default khi false", () => {
    expect(toAddressBody(addressFormSchema.parse(valid))).toEqual({
      recipient_name: "Minh Anh",
      phone_number: "090 123 4567",
      full_address: "123 Nguyễn Văn Cừ, Q5",
    });
  });

  it("gửi is_default: true khi đặt mặc định", () => {
    expect(toAddressBody(addressFormSchema.parse({ ...valid, isDefault: true }))).toMatchObject({ is_default: true });
  });
});
