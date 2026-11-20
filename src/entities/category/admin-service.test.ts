/** @jest-environment node */
import { apiFetch } from "@/lib/api/http";
import { adminCategoryService } from "./admin-service";

jest.mock("@/lib/api/http", () => ({ apiFetch: jest.fn() }));

const mockFetch = jest.mocked(apiFetch);

describe("adminCategoryService", () => {
  it("list chỉ gửi tham số có giá trị, giữ isActive=false", async () => {
    mockFetch.mockResolvedValueOnce({ items: [] });
    await adminCategoryService.list({ search: undefined, isActive: false, page: 2, limit: 20 });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/categories?isActive=false&page=2&limit=20");
  });

  it("get gọi theo id", async () => {
    mockFetch.mockResolvedValueOnce({ id: "x" });
    await adminCategoryService.get("bbbbbbbb-0000-4000-8000-000000000011");
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/categories/bbbbbbbb-0000-4000-8000-000000000011");
  });

  it("listIndustries đọc items từ { items, total } và chỉ giữ id, name", async () => {
    mockFetch.mockResolvedValueOnce({
      items: [{ id: "i1", name: "Điện tử", icon: null, sort_order: 1, categories: [] }],
      total: 1,
    });
    await expect(adminCategoryService.listIndustries()).resolves.toEqual([{ id: "i1", name: "Điện tử" }]);
    expect(mockFetch).toHaveBeenCalledWith("/api/industries");
  });
});
