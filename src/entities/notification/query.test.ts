import { parsePage, parsePageSize } from "./query";

describe("parsePage", () => {
  it.each([
    ["3", 3],
    [["2", "5"], 2],
    ["0", 1],
    ["-1", 1],
    ["1.5", 1],
    ["abc", 1],
    ["", 1],
    [null, 1],
    [undefined, 1],
  ])("%j → %d", (raw, expected) => {
    expect(parsePage(raw)).toBe(expected);
  });
});

describe("parsePageSize", () => {
  it.each([
    ["5", 5],
    ["50", 50],
    ["51", 50],
    ["abc", 10],
    [null, 10],
    ["0", 10],
  ])("%j → %d", (raw, expected) => {
    expect(parsePageSize(raw)).toBe(expected);
  });
});
