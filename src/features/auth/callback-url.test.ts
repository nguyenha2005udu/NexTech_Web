import { safeCallbackUrl } from "./callback-url";

describe("safeCallbackUrl", () => {
  it.each([
    ["/account/orders"],
    ["/account/orders?status=pending"],
    ["/checkout?buyNow=asus&qty=2"],
    ["/products/abc#reviews"],
    ["/"],
  ])("giữ nguyên đường dẫn nội bộ %s", (path) => {
    expect(safeCallbackUrl(path)).toBe(path);
  });

  it.each([
    ["//evil.com", "hai dấu gạch chéo"],
    ["/\\evil.com", "gạch ngược đứng sau /"],
    ["/\\\\evil.com", "hai gạch ngược"],
    ["/\\/evil.com", "gạch ngược rồi gạch chéo"],
    ["/\t/evil.com", "tab chen giữa"],
    ["/\n/evil.com", "xuống dòng chen giữa"],
    ["/\r/evil.com", "CR chen giữa"],
    ["/\u0000/evil.com", "ký tự NUL"],
    ["/a/../..//evil.com", "chuẩn hoá `..` lộ ra //"],
    ["/a/..//evil.com", "chuẩn hoá `..` lộ ra //"],
    ["https://evil.com", "URL tuyệt đối"],
    ["http://evil.com/x", "URL tuyệt đối http"],
    ["javascript:alert(1)", "scheme javascript"],
    ["evil.com", "không bắt đầu bằng /"],
    [" /account", "khoảng trắng đầu"],
    ["", "chuỗi rỗng"],
  ])("chặn %j (%s) và về trang chủ", (value) => {
    expect(safeCallbackUrl(value)).toBe("/");
  });

  it("null / undefined về trang chủ", () => {
    expect(safeCallbackUrl(null)).toBe("/");
    expect(safeCallbackUrl(undefined)).toBe("/");
  });

  it("dấu / đã mã hoá thì vẫn là đường dẫn nội bộ, không thành host khác", () => {
    expect(safeCallbackUrl("/%2f%2fevil.com")).toBe("/%2f%2fevil.com");
    expect(safeCallbackUrl("/%5Cevil.com")).toBe("/%5Cevil.com");
  });

  it("kết quả luôn cùng origin với trang dù đầu vào lạ", () => {
    const inputs = ["/a", "/\\b", "//c", "/d?e=//f", "/g#//h", "/%09/i", "/j/../..//k"];
    for (const v of inputs) {
      const result = safeCallbackUrl(v);
      expect(new URL(result, "https://shop.example").origin).toBe("https://shop.example");
    }
  });

  it("dùng được đường dẫn dự phòng tuỳ chọn", () => {
    expect(safeCallbackUrl("//evil.com", "/account")).toBe("/account");
  });
});
