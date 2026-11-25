/** @jest-environment node */
import { notificationService } from "@/entities/notification/service";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { POST as markRead } from "./read/route";
import { GET } from "./route";

jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/notification/service", () => ({
  notificationService: { list: jest.fn(), markRead: jest.fn() },
}));

const mockSession = jest.mocked(getSessionUser);
const mockList = jest.mocked(notificationService.list);
const mockMarkRead = jest.mocked(notificationService.markRead);

const user: SessionUser = { id: "u-1", email: "a@example.com", full_name: "A", role: "user", avatar_url: null };
const get = (query = "") => new Request(`http://localhost/api/notifications${query}`);
const post = (body: unknown) =>
  new Request("http://localhost/api/notifications/read", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  mockSession.mockResolvedValue(user);
  mockList.mockResolvedValue({ items: [], unread: 0, page: 1, total: 0 });
});
afterEach(() => jest.clearAllMocks());

describe("GET /api/notifications", () => {
  it("khách bị 401, không đọc dữ liệu", async () => {
    mockSession.mockResolvedValue(null);
    expect((await GET(get())).status).toBe(401);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("người dùng nhận danh sách, không cache", async () => {
    const res = await GET(get());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ items: [], unread: 0, page: 1, total: 0 });
    expect(mockList).toHaveBeenCalledWith(1, 10);
  });

  it("đọc ?page= và ?limit= từ query", async () => {
    await GET(get("?page=3&limit=5"));
    expect(mockList).toHaveBeenCalledWith(3, 5);
  });

  it.each([
    ["page sai", "?page=abc", 1, 10],
    ["page âm", "?page=-2", 1, 10],
    ["limit quá lớn bị chặn ở 50", "?limit=9999", 1, 50],
    ["limit thập phân", "?limit=2.5", 1, 10],
  ])("%s thì dùng giá trị an toàn", async (_label, query, page, limit) => {
    await GET(get(query));
    expect(mockList).toHaveBeenCalledWith(page, limit);
  });
});

describe("POST /api/notifications/read", () => {
  it("khách bị 401, không đánh dấu", async () => {
    mockSession.mockResolvedValue(null);
    expect((await markRead(post({}))).status).toBe(401);
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it("đánh dấu theo ids", async () => {
    expect((await markRead(post({ ids: ["n-1"] }))).status).toBe(200);
    expect(mockMarkRead).toHaveBeenCalledWith(["n-1"]);
  });

  it("không có ids thì đánh dấu tất cả", async () => {
    await markRead(post({}));
    expect(mockMarkRead).toHaveBeenCalledWith(undefined);
  });

  it.each([{ ids: [] }, { ids: "n-1" }, { ids: [1] }])("từ chối đầu vào sai %#", async (body) => {
    expect((await markRead(post(body))).status).toBe(400);
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it("body không phải JSON bị từ chối, không đọc tất cả", async () => {
    const res = await markRead(new Request("http://localhost/x", { method: "POST", body: "oops" }));
    expect(res.status).toBe(400);
    expect(mockMarkRead).not.toHaveBeenCalled();
  });
});
