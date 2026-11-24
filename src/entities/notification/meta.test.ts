import { isInternalLink } from "./meta";

describe("isInternalLink", () => {
  it.each(["/account/orders/1", "/products/asus"])("%s là link nội bộ", (link) => {
    expect(isInternalLink(link)).toBe(true);
  });

  it.each(["https://evil.example", "//evil.example", "javascript:alert(1)", ""])("%p bị từ chối", (link) => {
    expect(isInternalLink(link)).toBe(false);
  });
});
