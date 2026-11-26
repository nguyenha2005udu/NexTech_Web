/**
 * @jest-environment node
 */
import { ApiError, apiFetch, apiFetchForm, apiFetchPublic } from "./http";

const cookieStore = {
  get: jest.fn((name: string) => (name === "access_token" ? { value: "at-1" } : undefined)),
  set: jest.fn(),
};
jest.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const fetchMock = jest.fn<Promise<Response>, [URL, RequestInit]>();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeAll(() => {
  process.env.API_BASE_URL = "http://gateway.test";
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("apiFetch", () => {
  it("gửi body JSON, kèm cookie phiên, trả về dữ liệu không bọc", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "c-1" }));

    const data = await apiFetch<{ id: string }>("/api/admin/categories/c-1", { method: "PATCH", body: { name: "Laptop" } });

    expect(data).toEqual({ id: "c-1" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url.toString()).toBe("http://gateway.test/api/admin/categories/c-1");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ name: "Laptop" }));
    expect(init.headers).toMatchObject({ "Content-Type": "application/json", Cookie: "access_token=at-1" });
  });

  it("gửi thêm header tuỳ chọn (vd. Idempotency-Key)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: "o-1" }));
    await apiFetch("/api/orders", { method: "POST", body: {}, headers: { "Idempotency-Key": "k-1" } });
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers).toMatchObject({ "Idempotency-Key": "k-1", "Content-Type": "application/json" });
  });

  it("không gửi Content-Type khi không có body", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    await apiFetch("/api/admin/categories");
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("GET");
    expect(init.headers).not.toHaveProperty("Content-Type");
  });

  it("đổi body lỗi backend thành ApiError (lấy câu đầu khi message là mảng)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { statusCode: 400, code: "NT-GEN-0001", message: ["name không được rỗng", "x"] }),
    );
    await expect(apiFetch("/api/admin/categories", { method: "POST", body: {} })).rejects.toEqual(
      new ApiError(400, "name không được rỗng", "NT-GEN-0001"),
    );
  });

  it("báo 503 khi không kết nối được gateway", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(apiFetch("/api/admin/orders")).rejects.toMatchObject({ status: 503 });
  });
});

describe("apiFetchForm", () => {
  it("gửi FormData nguyên vẹn và không tự đặt Content-Type (để fetch ghi boundary)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: "img-1" }));
    const form = new FormData();
    form.set("image_url", "https://cdn.test/a.png");

    await apiFetchForm("/api/admin/products/p-1/images", form);

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(form);
    expect(init.headers).not.toHaveProperty("Content-Type");
  });
});

describe("apiFetchPublic", () => {
  it("không gửi cookie, truyền revalidate cho fetch và trả dữ liệu", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { items: [] }));

    const data = await apiFetchPublic<{ items: unknown[] }>("/api/products", 300);

    expect(data).toEqual({ items: [] });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url.toString()).toBe("http://gateway.test/api/products");
    expect(init.headers).not.toHaveProperty("Cookie");
    expect(init).toMatchObject({ next: { revalidate: 300 } });
    expect(cookieStore.get).not.toHaveBeenCalled();
  });

  it("đổi body lỗi backend thành ApiError", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { statusCode: 404, code: "NT-CAT-0001", message: "Không tìm thấy" }));
    await expect(apiFetchPublic("/api/products/x")).rejects.toEqual(new ApiError(404, "Không tìm thấy", "NT-CAT-0001"));
  });

  it("body lỗi không đúng chuẩn thì dùng câu chung", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));
    await expect(apiFetchPublic("/api/products")).rejects.toMatchObject({ status: 500 });
  });

  it("báo 503 khi không kết nối được gateway", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(apiFetchPublic("/api/products")).rejects.toMatchObject({ status: 503 });
  });
});
