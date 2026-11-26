/** @jest-environment node */
import { orderService } from "@/entities/order/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { cancelOrder } from "./actions";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/order/service", () => ({ orderService: { getMine: jest.fn(), cancel: jest.fn() } }));

const mockSession = jest.mocked(getSessionUser);
const mockGetMine = jest.mocked(orderService.getMine);
const mockCancel = jest.mocked(orderService.cancel);

const user: SessionUser = { id: "u-1", email: "a@example.com", full_name: "A", role: "user", avatar_url: null };
const pendingCod = { id: "o-1", status: "pending" as const, total: 1, payment_method: "cod" as const, payment_status: null };

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  mockGetMine.mockResolvedValue(pendingCod);
  mockCancel.mockResolvedValue(undefined);
});
afterEach(() => jest.clearAllMocks());

describe("cancelOrder", () => {
  it("khách chưa đăng nhập bị chuyển tới /login, không huỷ", async () => {
    mockSession.mockResolvedValue(null);
    await expect(cancelOrder({ orderId: "o-1" })).rejects.toThrow("REDIRECT:/login");
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("đầu vào thiếu mã đơn bị từ chối", async () => {
    expect(await cancelOrder({})).toMatchObject({ ok: false });
    expect(mockGetMine).not.toHaveBeenCalled();
  });

  it("không có đơn (hoặc đơn của người khác)", async () => {
    mockGetMine.mockResolvedValue(null);
    expect(await cancelOrder({ orderId: "o-x" })).toEqual({ ok: false, message: "Không tìm thấy đơn hàng" });
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("từ chối huỷ đơn đã giao", async () => {
    mockGetMine.mockResolvedValue({ ...pendingCod, status: "shipped" });
    expect(await cancelOrder({ orderId: "o-1" })).toEqual({ ok: false, message: "Đơn hàng này không còn huỷ được" });
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("huỷ đơn chờ xử lý", async () => {
    expect(await cancelOrder({ orderId: "o-1" })).toEqual({ ok: true, data: { orderId: "o-1" } });
    expect(mockCancel).toHaveBeenCalledWith("o-1");
  });

  it("lỗi backend khi huỷ trả về thông báo cho người dùng", async () => {
    mockCancel.mockRejectedValue(new ApiError(409, "Đơn đã được xử lý", "NT-ORD-1002"));
    expect(await cancelOrder({ orderId: "o-1" })).toEqual({ ok: false, message: "Đơn đã được xử lý" });
  });
});
