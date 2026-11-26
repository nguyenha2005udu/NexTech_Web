/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { addressService } from "@/entities/address/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { createAddress, deleteAddress, setDefaultAddress, updateAddress } from "./actions";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/address/service", () => ({
  addressService: { create: jest.fn(), update: jest.fn(), setDefault: jest.fn(), remove: jest.fn() },
}));

const mockSession = jest.mocked(getSessionUser);
const svc = jest.mocked(addressService);
const user: SessionUser = { id: "u-1", email: "a@nextech.local", full_name: "A", role: "user", avatar_url: null };
const form = { recipientName: "Minh Anh", phoneNumber: "0901234567", fullAddress: "123 Nguyễn Văn Cừ, Q5", isDefault: true };

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  svc.create.mockResolvedValue({} as never);
  svc.update.mockResolvedValue({} as never);
});
afterEach(() => jest.clearAllMocks());

describe("phân quyền", () => {
  it.each([
    ["createAddress", () => createAddress(form)],
    ["updateAddress", () => updateAddress("a1", form)],
    ["setDefaultAddress", () => setDefaultAddress("a1")],
    ["deleteAddress", () => deleteAddress("a1")],
  ])("%s: chưa đăng nhập thì chuyển sang /login, không gọi backend", async (_name, run) => {
    mockSession.mockResolvedValue(null);
    await expect(run()).rejects.toThrow("REDIRECT:/login");
    expect(svc.create).not.toHaveBeenCalled();
    expect(svc.update).not.toHaveBeenCalled();
    expect(svc.setDefault).not.toHaveBeenCalled();
    expect(svc.remove).not.toHaveBeenCalled();
  });
});

describe("createAddress", () => {
  it("dữ liệu sai: trả lỗi theo ô, không gọi backend", async () => {
    expect(await createAddress({ ...form, phoneNumber: "abc" })).toMatchObject({
      ok: false,
      fieldErrors: { phoneNumber: "Số điện thoại không hợp lệ" },
    });
    expect(svc.create).not.toHaveBeenCalled();
  });

  it("gửi body theo backend và làm mới trang địa chỉ + thanh toán", async () => {
    expect(await createAddress(form)).toEqual({ ok: true });
    expect(svc.create).toHaveBeenCalledWith({
      recipient_name: "Minh Anh",
      phone_number: "0901234567",
      full_address: "123 Nguyễn Văn Cừ, Q5",
      is_default: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/account/addresses");
    expect(revalidatePath).toHaveBeenCalledWith("/checkout");
  });

  it("lỗi backend trả thông báo cho người dùng", async () => {
    svc.create.mockRejectedValue(new ApiError(400, "Số điện thoại không hợp lệ"));
    expect(await createAddress(form)).toEqual({ ok: false, message: "Số điện thoại không hợp lệ" });
  });
});

describe("updateAddress / setDefaultAddress / deleteAddress", () => {
  it("updateAddress gọi backend theo id", async () => {
    expect(await updateAddress("a1", form)).toEqual({ ok: true });
    expect(svc.update).toHaveBeenCalledWith("a1", expect.objectContaining({ full_address: "123 Nguyễn Văn Cừ, Q5" }));
  });

  it("id rỗng bị từ chối", async () => {
    expect(await deleteAddress("")).toMatchObject({ ok: false });
    expect(svc.remove).not.toHaveBeenCalled();
  });

  it("địa chỉ không tồn tại (NT-IDN-1004) trả thông báo", async () => {
    svc.setDefault.mockRejectedValue(new ApiError(404, "Không tìm thấy địa chỉ", "NT-IDN-1004"));
    expect(await setDefaultAddress("a1")).toMatchObject({ ok: false, message: "Không tìm thấy địa chỉ" });
  });

  it("deleteAddress thành công thì làm mới trang", async () => {
    expect(await deleteAddress("a1")).toEqual({ ok: true });
    expect(svc.remove).toHaveBeenCalledWith("a1");
    expect(revalidatePath).toHaveBeenCalledWith("/account/addresses");
  });
});
