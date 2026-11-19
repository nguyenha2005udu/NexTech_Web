import { adminNav, findAdminNavItem } from "./admin-nav";

describe("findAdminNavItem", () => {
  it.each([
    ["/admin", "dashboard"],
    ["/admin/", "dashboard"],
    ["/admin/orders", "orders"],
    ["/admin/orders/abc", "orders"],
    ["/admin/transactions", "transactions"],
    ["/admin/users", "users"],
  ])("%s → %s", (pathname, key) => {
    expect(findAdminNavItem(pathname)?.key).toBe(key);
  });

  it("không nhầm tiền tố giống nhau (/admin/ordersx không phải Đơn hàng)", () => {
    expect(findAdminNavItem("/admin/ordersx")).toBeUndefined();
  });

  it("trang ngoài khu admin không khớp mục nào", () => {
    expect(findAdminNavItem("/account/orders")).toBeUndefined();
  });
});

describe("adminNav", () => {
  it("có đủ 7 mục, key không trùng, đúng thứ tự mockup + Người dùng cuối", () => {
    expect(adminNav.map((i) => i.label)).toEqual([
      "Tổng quan",
      "Danh mục",
      "Sản phẩm",
      "Đơn hàng",
      "Mã giảm giá",
      "Thanh toán",
      "Người dùng",
    ]);
    expect(new Set(adminNav.map((i) => i.key)).size).toBe(adminNav.length);
  });
});
