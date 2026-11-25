/** @jest-environment node */
import { reviewService } from "@/entities/review/service";
import { GET } from "./route";

jest.mock("@/entities/review/service", () => ({ reviewService: { listPage: jest.fn() } }));
const mockList = jest.mocked(reviewService.listPage);

const call = (query = "", productId = "p-1") =>
  GET(new Request(`http://localhost/api/products/${productId}/reviews${query}`), { params: Promise.resolve({ productId }) });

beforeEach(() => mockList.mockResolvedValue({ items: [], page: 1, total: 0 }));
afterEach(() => jest.clearAllMocks());

describe("GET /api/products/[productId]/reviews", () => {
  it("công khai: không cần phiên, trả trang đầu với cỡ mặc định", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [], page: 1, total: 0 });
    expect(mockList).toHaveBeenCalledWith("p-1", 1, 3);
  });

  it("đọc page và limit từ query", async () => {
    await call("?page=2&limit=5", "p-9");
    expect(mockList).toHaveBeenCalledWith("p-9", 2, 5);
  });

  it.each([
    ["?page=abc", 1, 3],
    ["?page=-1", 1, 3],
    ["?limit=500", 1, 20],
    ["?limit=0", 1, 3],
  ])("%s dùng giá trị an toàn", async (query, page, limit) => {
    await call(query);
    expect(mockList).toHaveBeenCalledWith("p-1", page, limit);
  });
});
