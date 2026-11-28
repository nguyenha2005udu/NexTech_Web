import { pageWindow, positiveInt } from "./pagination";

describe("positiveInt", () => {
  it.each([
    ["3", 3],
    [["2", "5"], 2],
    ["0", 7],
    ["-1", 7],
    ["1.5", 7],
    ["abc", 7],
    ["", 7],
    [null, 7],
    [undefined, 7],
  ])("%j → %d", (raw, expected) => {
    expect(positiveInt(raw, 7)).toBe(expected);
  });

  it("vượt giới hạn thì lấy giới hạn", () => {
    expect(positiveInt("999", 1, 50)).toBe(50);
  });
});

describe("pageWindow", () => {
  it("ít trang thì hiện hết", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("nhiều trang: luôn có trang đầu, cuối, hiện tại ± 1 và 'gap' ở khoảng trống", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, "gap", 20]);
    expect(pageWindow(7, 20)).toEqual([1, "gap", 6, 7, 8, "gap", 20]);
    expect(pageWindow(20, 20)).toEqual([1, "gap", 19, 20]);
  });

  it("khoảng trống đúng 1 trang thì hiện luôn số đó thay vì '…'", () => {
    expect(pageWindow(4, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
    expect(pageWindow(17, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20]);
  });

  it("trang ngoài khoảng được kẹp vào [1, totalPages]", () => {
    expect(pageWindow(0, 5)).toEqual([1, 2, "gap", 5]);
    expect(pageWindow(99, 20)).toEqual([1, "gap", 19, 20]);
  });
});
