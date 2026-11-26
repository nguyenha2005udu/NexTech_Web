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
  return { ApiError, apiFetchPublic: jest.fn() };
});

import { ApiError, apiFetchPublic } from "@/lib/api/http";
import { categoryService } from "./service";

const fetchMock = apiFetchPublic as jest.Mock;
const raw = (id: string, name: string, sortOrder: number, isActive = true) => ({ id, name, sortOrder, isActive });

afterEach(() => jest.resetAllMocks());

describe("categoryService", () => {
  it("list: bỏ danh mục đã tắt, sắp theo sortOrder, id làm slug", async () => {
    fetchMock.mockResolvedValue([raw("b", "Màn hình", 2), raw("a", "Laptop", 1), raw("x", "Ẩn", 0, false)]);
    const list = await categoryService.list();
    expect(list.map((c) => c.slug)).toEqual(["a", "b"]);
    expect(list.map((c) => c.icon)).toEqual(["laptop", "monitor"]);
  });

  it("icon rơi về 'device' khi tên không khớp từ khoá", async () => {
    fetchMock.mockResolvedValue([raw("a", "Đồ chơi", 1)]);
    expect((await categoryService.list())[0]?.icon).toBe("device");
  });

  it("listNav chỉ lấy 4 danh mục đầu", async () => {
    fetchMock.mockResolvedValue([1, 2, 3, 4, 5, 6].map((n) => raw(String(n), `D${n}`, n)));
    expect(await categoryService.listNav()).toHaveLength(4);
  });

  it("getBySlug trả null khi 404 hoặc 400, ném lại lỗi khác", async () => {
    fetchMock.mockRejectedValueOnce(new ApiError(404, "x"));
    expect(await categoryService.getBySlug("a")).toBeNull();
    fetchMock.mockRejectedValueOnce(new ApiError(400, "x"));
    expect(await categoryService.getBySlug("laptop")).toBeNull();
    fetchMock.mockRejectedValueOnce(new ApiError(503, "x"));
    await expect(categoryService.getBySlug("a")).rejects.toThrow();
  });

  it("getBySlug map chi tiết", async () => {
    fetchMock.mockResolvedValue(raw("a", "Laptop", 1));
    expect(await categoryService.getBySlug("a")).toMatchObject({ id: "a", slug: "a", name: "Laptop" });
  });
});
