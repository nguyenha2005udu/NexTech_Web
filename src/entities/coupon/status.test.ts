import { couponDisplayStatus } from "./status";

const NOW = new Date("2026-11-20T05:00:00.000Z");
const base = { is_active: true, valid_from: null, valid_until: null };

describe("couponDisplayStatus (✅Q-CP1)", () => {
  it("tắt tay → Tạm dừng, kể cả khi đã hết hạn", () => {
    expect(couponDisplayStatus({ ...base, is_active: false }, NOW)).toBe("paused");
    expect(couponDisplayStatus({ ...base, is_active: false, valid_until: "2026-03-01T00:00:00.000Z" }, NOW)).toBe("paused");
  });

  it("quá ngày kết thúc → Hết hạn", () => {
    expect(couponDisplayStatus({ ...base, valid_until: "2026-03-01T00:00:00.000Z" }, NOW)).toBe("expired");
  });

  it("chưa tới ngày bắt đầu → Chưa bắt đầu", () => {
    expect(couponDisplayStatus({ ...base, valid_from: "2099-01-01T00:00:00.000Z" }, NOW)).toBe("scheduled");
  });

  it("đang bật, trong thời hạn hoặc không có ngày → Đang chạy", () => {
    expect(couponDisplayStatus(base, NOW)).toBe("running");
    expect(
      couponDisplayStatus({ ...base, valid_from: "2026-11-01T00:00:00.000Z", valid_until: "2026-12-31T00:00:00.000Z" }, NOW),
    ).toBe("running");
  });
});
