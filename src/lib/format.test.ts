import {
  formatCompactVND,
  formatDate,
  formatDateTime,
  formatOrderCode,
  formatPaymentCode,
  formatVND,
} from "./format";

// Intl có thể dùng khoảng trắng không ngắt (U+00A0) — chuẩn hoá để so sánh.
const plain = (s: string) => s.replace(/\s/g, " ");

describe("formatVND", () => {
  it("thêm dấu chấm hàng nghìn và ký hiệu ₫", () => {
    expect(plain(formatVND(64_980_000))).toBe("64.980.000 ₫");
  });
});

describe("formatDate / formatDateTime", () => {
  it("in ngày theo giờ Việt Nam", () => {
    expect(formatDate("2026-07-23T17:30:00.000Z")).toBe("24/07/2026");
  });

  it("in ngày trước, giờ 24h sau", () => {
    expect(formatDateTime("2026-07-24T03:24:00.000Z")).toBe("24/07/2026 10:24");
  });

  it("giờ chiều dùng định dạng 24h", () => {
    expect(formatDateTime("2026-07-23T09:45:00.000Z")).toBe("23/07/2026 16:45");
  });
});

describe("formatCompactVND", () => {
  it("rút gọn hàng tỷ với tối đa 2 chữ số thập phân", () => {
    expect(plain(formatCompactVND(2_450_000_000))).toBe("2,45 tỷ ₫");
  });

  it("rút gọn hàng triệu", () => {
    expect(plain(formatCompactVND(41_500_000))).toBe("41,5 triệu ₫");
  });

  it("dưới 1 triệu giữ nguyên định dạng đầy đủ", () => {
    expect(plain(formatCompactVND(950_000))).toBe("950.000 ₫");
  });
});

describe("formatOrderCode / formatPaymentCode", () => {
  const uuid = "a1b2c3d4-5e6f-4a1b-9c8d-123456789abc";

  it("lấy 8 ký tự đầu, viết hoa, thêm #", () => {
    expect(formatOrderCode(uuid)).toBe("#A1B2C3D4");
  });

  it("mã giao dịch có tiền tố PAY-", () => {
    expect(formatPaymentCode(uuid)).toBe("PAY-A1B2C3D4");
  });

  it("bỏ dấu gạch khi phần đầu UUID ngắn hơn 8 ký tự", () => {
    expect(formatOrderCode("ab-cdef-1234")).toBe("#ABCDEF12");
  });
});
