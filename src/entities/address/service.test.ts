jest.mock("server-only", () => ({}));
jest.mock("@/lib/api/http", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return { ApiError, apiFetch: jest.fn() };
});

import { ApiError, apiFetch } from "@/lib/api/http";
import { addressService } from "./service";

const fetchMock = apiFetch as jest.Mock;
const raw = (over: Record<string, unknown> = {}) => ({
  id: "a1",
  full_address: "1 Đại Cồ Việt, Hà Nội",
  recipient_name: "Người mua",
  phone_number: "0900000002",
  is_default: false,
  ...over,
});

afterEach(() => jest.resetAllMocks());

describe("addressService", () => {
  it("listMine gọi API sổ địa chỉ của chính mình", async () => {
    fetchMock.mockResolvedValue([]);
    await addressService.listMine();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/me/addresses");
  });

  it("listMine đưa địa chỉ mặc định lên đầu", async () => {
    fetchMock.mockResolvedValue([raw({ id: "a1" }), raw({ id: "a2", is_default: true })]);
    expect((await addressService.listMine()).map((a) => a.id)).toEqual(["a2", "a1"]);
  });

  it("tên và số điện thoại thiếu thì thành chuỗi rỗng, nhãn là null", async () => {
    fetchMock.mockResolvedValue([raw({ recipient_name: null, phone_number: null })]);
    expect((await addressService.listMine())[0]).toMatchObject({ recipient_name: "", phone_number: "", label: null });
  });

  it("getMine map địa chỉ tìm thấy", async () => {
    fetchMock.mockResolvedValue(raw());
    expect(await addressService.getMine("a1")).toMatchObject({ id: "a1", full_address: "1 Đại Cồ Việt, Hà Nội" });
  });

  it("getMine trả null khi 404 hoặc 400, ném lại lỗi khác", async () => {
    fetchMock.mockRejectedValueOnce(new ApiError(404, "x"));
    expect(await addressService.getMine("a1")).toBeNull();
    fetchMock.mockRejectedValueOnce(new ApiError(400, "x"));
    expect(await addressService.getMine("zz")).toBeNull();
    fetchMock.mockRejectedValueOnce(new ApiError(503, "x"));
    await expect(addressService.getMine("a1")).rejects.toThrow();
  });

  it("create gửi POST với body đã chuẩn hoá", async () => {
    fetchMock.mockResolvedValue(raw({ id: "new" }));
    const created = await addressService.create({ recipient_name: "A", phone_number: "0900000001", full_address: "X" });
    expect(fetchMock).toHaveBeenCalledWith("/api/users/me/addresses", {
      method: "POST",
      body: { recipient_name: "A", phone_number: "0900000001", full_address: "X" },
    });
    expect(created.id).toBe("new");
  });

  it("update, setDefault, remove gọi đúng đường dẫn và phương thức", async () => {
    fetchMock.mockResolvedValue(raw());
    await addressService.update("a1", { recipient_name: "A", phone_number: "0900000001", full_address: "X" });
    await addressService.setDefault("a1");
    await addressService.remove("a1");
    expect(fetchMock.mock.calls.map(([path, init]) => [path, init?.method])).toEqual([
      ["/api/users/me/addresses/a1", "PUT"],
      ["/api/users/me/addresses/a1/default", "PUT"],
      ["/api/users/me/addresses/a1", "DELETE"],
    ]);
  });
});
