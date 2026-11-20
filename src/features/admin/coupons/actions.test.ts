/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { saveCoupon, toggleCoupon } from "./actions";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/lib/api/http", () => {
  const actual: typeof import("@/lib/api/http") = jest.requireActual("@/lib/api/http");
  return { ...actual, apiFetch: jest.fn() };
});

const mockSession = jest.mocked(getSessionUser);
const mockFetch = jest.mocked(apiFetch);
const ID = "c22e5c86-715a-43a1-b459-cb91ccec43f4";
const form = {
  code: "SALE10",
  description: "Giảm 10%",
  category: "order",
  discountType: "percent",
  discountValue: 10,
  maxDiscount: null,
  minOrderValue: null,
  usageLimit: 500,
  validFrom: undefined,
  validUntil: "2026-12-31",
  isActive: true,
};

const user = (role: SessionUser["role"]): SessionUser => ({
  id: "u-1",
  email: "a@nextech.local",
  full_name: "A",
  role,
  avatar_url: null,
});

beforeEach(() => mockSession.mockResolvedValue(user("admin")));

describe("saveCoupon", () => {
  it("người dùng thường bị chuyển sang /403, không gọi API", async () => {
    mockSession.mockResolvedValue(user("user"));
    await expect(saveCoupon(null, form)).rejects.toThrow("REDIRECT:/403");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("thêm: POST body snake_case rồi revalidate", async () => {
    mockFetch.mockResolvedValueOnce({});
    await expect(saveCoupon(null, form)).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/discount-codes", {
      method: "POST",
      body: expect.objectContaining({
        code: "SALE10",
        discount_type: "percent",
        discount_value: 10,
        usage_limit: 500,
        valid_until: "2026-12-31T23:59:59+07:00",
        is_active: true,
      }),
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/coupons");
  });

  it("sửa: PUT theo id, không gửi code (kể cả khi form có)", async () => {
    mockFetch.mockResolvedValueOnce({});
    await saveCoupon(ID, form);
    const [path, init] = mockFetch.mock.calls[0] ?? [];
    expect(path).toBe(`/api/admin/discount-codes/${ID}`);
    expect(init).toMatchObject({ method: "PUT" });
    expect(init?.body).not.toHaveProperty("code");
  });

  it("mã đã tồn tại (409 NT-PRM-1011) → lỗi gắn vào ô code", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(409, "Mã giảm giá đã tồn tại", "NT-PRM-1011"));
    await expect(saveCoupon(null, form)).resolves.toEqual({
      ok: false,
      message: "Mã giảm giá đã tồn tại",
      fieldErrors: { code: "Mã giảm giá đã tồn tại" },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("input sai → lỗi theo ô, không gọi API", async () => {
    const result = await saveCoupon(null, { ...form, discountValue: 120 });
    expect(result).toMatchObject({ ok: false, fieldErrors: { discountValue: "Phần trăm tối đa 100" } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("id sai định dạng bị từ chối", async () => {
    await expect(saveCoupon("abc", form)).resolves.toEqual({ ok: false, message: "Mã giảm giá không hợp lệ" });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("toggleCoupon", () => {
  it("tạm dừng → DELETE (backend chỉ đặt is_active = false)", async () => {
    mockFetch.mockResolvedValueOnce({ message: "Đã vô hiệu hoá mã giảm giá" });
    await expect(toggleCoupon(ID, false)).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/discount-codes/${ID}`, { method: "DELETE" });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/coupons");
  });

  it("kích hoạt → PUT { is_active: true }", async () => {
    mockFetch.mockResolvedValueOnce({});
    await toggleCoupon(ID, true);
    expect(mockFetch).toHaveBeenCalledWith(`/api/admin/discount-codes/${ID}`, { method: "PUT", body: { is_active: true } });
  });

  it("id hoặc cờ sai → từ chối, không gọi API", async () => {
    await expect(toggleCoupon("1 OR 1=1", true)).resolves.toMatchObject({ ok: false });
    await expect(toggleCoupon(ID, "true")).resolves.toMatchObject({ ok: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("không tìm thấy (404 NT-PRM-1010) → trả câu backend", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy mã giảm giá", "NT-PRM-1010"));
    await expect(toggleCoupon(ID, false)).resolves.toEqual({ ok: false, message: "Không tìm thấy mã giảm giá" });
  });

  it("khách chưa đăng nhập bị chuyển sang trang đăng nhập", async () => {
    mockSession.mockResolvedValue(null);
    await expect(toggleCoupon(ID, false)).rejects.toThrow("REDIRECT:/login");
  });
});
