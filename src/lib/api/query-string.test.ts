import { toQueryString } from "./query-string";

describe("toQueryString", () => {
  it("bỏ tham số rỗng, undefined, null", () => {
    expect(toQueryString({ page: 1, search: "", status: undefined, industryId: null })).toBe("?page=1");
  });

  it("giữ boolean false và số 0", () => {
    expect(toQueryString({ isActive: false, sortOrder: 0 })).toBe("?isActive=false&sortOrder=0");
  });

  it("mã hoá ký tự đặc biệt", () => {
    expect(toQueryString({ search: "tai nghe & loa" })).toBe("?search=tai+nghe+%26+loa");
  });

  it("không còn tham số thì trả chuỗi rỗng", () => {
    expect(toQueryString({})).toBe("");
  });
});
