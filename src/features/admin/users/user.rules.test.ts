import { isSelf, parseUserListParams, parseUserView, USER_PAGE_SIZE } from "./user.rules";

const ID = "cccccccc-0000-4000-8000-000000000001";

describe("parseUserListParams", () => {
  it("URL trống → trang 1, không lọc", () => {
    expect(parseUserListParams({})).toEqual({
      search: undefined,
      role: undefined,
      is_active: undefined,
      page: 1,
      limit: USER_PAGE_SIZE,
    });
  });

  it("?q=&role=&status=&page= → tham số API", () => {
    expect(parseUserListParams({ q: "  an  ", role: "admin", status: "active", page: "3" })).toEqual({
      search: "an",
      role: "admin",
      is_active: "true",
      page: 3,
      limit: USER_PAGE_SIZE,
    });
  });

  it("status=locked → is_active=false", () => {
    expect(parseUserListParams({ status: "locked" }).is_active).toBe("false");
  });

  it("giá trị lạ bị bỏ qua", () => {
    expect(parseUserListParams({ role: "root", status: "deleted", q: "   " })).toMatchObject({
      search: undefined,
      role: undefined,
      is_active: undefined,
    });
  });

  it.each(["0", "-2", "1.5", "abc"])("page=%s → 1", (page) => {
    expect(parseUserListParams({ page }).page).toBe(1);
  });

  it("lấy giá trị đầu nếu tham số lặp; ô tìm cắt còn 100 ký tự", () => {
    const parsed = parseUserListParams({ role: ["user", "admin"], q: "x".repeat(150) });
    expect(parsed.role).toBe("user");
    expect(parsed.search).toHaveLength(100);
  });
});

describe("parseUserView", () => {
  it("UUID hợp lệ → id", () => {
    expect(parseUserView({ view: ID })).toBe(ID);
  });

  it.each([undefined, "", "abc", "../orders"])("%p → null", (view) => {
    expect(parseUserView({ view })).toBeNull();
  });
});

describe("isSelf", () => {
  it("so id người dùng với id admin đang đăng nhập", () => {
    expect(isSelf(ID, ID)).toBe(true);
    expect(isSelf(ID, "dddddddd-0000-4000-8000-000000000001")).toBe(false);
  });
});
