import { positiveInt } from "./pagination";

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
