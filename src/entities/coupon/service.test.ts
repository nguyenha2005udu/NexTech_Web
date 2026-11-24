/** @jest-environment node */
import { couponService } from "./service";

describe("couponService (người mua)", () => {
  it("tra mã không phân biệt hoa thường và bỏ khoảng trắng", async () => {
    expect(await couponService.findByCode("  nex200 ")).toMatchObject({ code: "NEX200" });
  });

  it("mã không tồn tại trả null", async () => {
    expect(await couponService.findByCode("KHONGCO")).toBeNull();
  });

  it("chỉ gợi ý mã đang bật", async () => {
    const list = await couponService.listAvailable();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((c) => c.is_active)).toBe(true);
  });
});
