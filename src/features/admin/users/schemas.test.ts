import { updateUserSchema } from "./schemas";

const ID = "cccccccc-0000-4000-8000-000000000001";

describe("updateUserSchema", () => {
  it.each([{ id: ID, role: "admin" }, { id: ID, is_active: false }, { id: ID, role: "user", is_active: true }])(
    "hợp lệ: %j",
    (input) => {
      expect(updateUserSchema.safeParse(input).success).toBe(true);
    },
  );

  it("thiếu cả role lẫn is_active → 'Chưa có thay đổi nào'", () => {
    const result = updateUserSchema.safeParse({ id: ID });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Chưa có thay đổi nào");
  });

  it("role lạ → 'Vai trò không hợp lệ'", () => {
    const result = updateUserSchema.safeParse({ id: ID, role: "root" });
    expect(result.error?.issues[0]?.message).toBe("Vai trò không hợp lệ");
  });

  it("is_active dạng chuỗi bị từ chối", () => {
    expect(updateUserSchema.safeParse({ id: ID, is_active: "false" }).success).toBe(false);
  });

  it("id không phải UUID → 'Mã người dùng không hợp lệ'", () => {
    const result = updateUserSchema.safeParse({ id: "u-1", role: "admin" });
    expect(result.error?.issues[0]?.message).toBe("Mã người dùng không hợp lệ");
  });
});
