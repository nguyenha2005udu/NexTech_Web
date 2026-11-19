/**
 * @jest-environment node
 */
import { z } from "zod";
import { failed, invalid } from "./action-result";
import { ApiError } from "./api/http";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));

describe("invalid", () => {
  const schema = z.object({ name: z.string().min(1, "Vui lòng nhập tên"), sort: z.number({ error: "Phải là số" }) });

  it("gom lỗi theo từng ô và lấy câu đầu làm thông báo chung", () => {
    const result = schema.safeParse({ name: "", sort: "x" });
    if (result.success) throw new Error("schema phải báo lỗi");
    expect(invalid(result.error)).toEqual({
      ok: false,
      message: "Vui lòng nhập tên",
      fieldErrors: { name: "Vui lòng nhập tên", sort: "Phải là số" },
    });
  });

  it("đường dẫn lồng nhau nối bằng dấu chấm", () => {
    const nested = z.object({ specs: z.array(z.object({ key: z.string().min(1, "Nhập tên thông số") })) });
    const result = nested.safeParse({ specs: [{ key: "" }] });
    if (result.success) throw new Error("schema phải báo lỗi");
    expect(invalid(result.error).fieldErrors).toEqual({ "specs.0.key": "Nhập tên thông số" });
  });
});

describe("failed", () => {
  it("lỗi backend thường → thông báo chung, không gắn ô", () => {
    expect(failed(new ApiError(404, "Không tìm thấy danh mục"))).toEqual({ ok: false, message: "Không tìm thấy danh mục" });
  });

  it("mã lỗi có trong bảng → gắn vào đúng ô", () => {
    const err = new ApiError(409, "Mã đã tồn tại", "NT-PRM-1011");
    expect(failed(err, { "NT-PRM-1011": "code" })).toEqual({
      ok: false,
      message: "Mã đã tồn tại",
      fieldErrors: { code: "Mã đã tồn tại" },
    });
  });

  it("mã lỗi không có trong bảng → chỉ thông báo chung", () => {
    const err = new ApiError(400, "Không thể chuyển trạng thái", "NT-ORD-1007");
    expect(failed(err, { "NT-PRM-1011": "code" })).not.toHaveProperty("fieldErrors");
  });

  it("lỗi không phải ApiError được ném tiếp", () => {
    expect(() => failed(new TypeError("bug"))).toThrow("bug");
  });
});
