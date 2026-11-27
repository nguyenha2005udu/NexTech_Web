/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/lib/api/http", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
      readonly code?: string,
    ) {
      super(message);
    }
  }
  return { ApiError, apiFetch: jest.fn(), apiFetchPublic: jest.fn() };
});

import { ApiError, apiFetch } from "@/lib/api/http";
import { conversationService } from "./service";

const fetchMock = jest.mocked(apiFetch);
const product = {
  id: "p-1",
  name: "Tai nghe Sony WH-CH520",
  brand: "Sony",
  price: "1290000",
  rating: "4.5",
  primary_image: "https://cdn.test/sony.png",
  category_name: "Tai nghe",
  tags: [],
};

afterEach(() => jest.resetAllMocks());

describe("conversationService.sendMessage", () => {
  it("gửi câu hỏi, đổi tin nhắn trợ lý + sản phẩm gợi ý sang model của web", async () => {
    fetchMock.mockResolvedValue({
      id: "m-2",
      sender: "agent",
      content: "Bên mình có tai nghe Sony dưới 2 triệu.",
      message_type: "product_card",
      metadata: { products: [product] },
      created_at: "2026-11-28T10:00:00.000Z",
    });

    const reply = await conversationService.sendMessage("c-1", "tai nghe dưới 2 triệu");

    expect(fetchMock).toHaveBeenCalledWith("/api/conversations/c-1/messages", {
      method: "POST",
      body: { content: "tai nghe dưới 2 triệu" },
    });
    expect(reply).toMatchObject({ id: "m-2", role: "assistant", text: "Bên mình có tai nghe Sony dưới 2 triệu." });
    expect(reply.products).toEqual([
      expect.objectContaining({ id: "p-1", slug: "p-1", name: "Tai nghe Sony WH-CH520", price: 1_290_000 }),
    ]);
  });

  it("câu trả lời không kèm sản phẩm thì không có trường products", async () => {
    fetchMock.mockResolvedValue({ id: "m-3", sender: "agent", content: "Chào bạn", message_type: "text", metadata: null });
    expect(await conversationService.sendMessage("c-1", "chào")).toEqual({ id: "m-3", role: "assistant", text: "Chào bạn" });
  });
});

describe("conversationService.getMine", () => {
  it("ghép thông tin phiên và tin nhắn (sender agent → assistant), tiêu đề rỗng thì 'Hội thoại mới'", async () => {
    fetchMock.mockImplementation(async (path: string) =>
      path.endsWith("/messages?limit=100")
        ? {
            data: [
              { id: "m-1", sender: "user", content: "laptop", metadata: null },
              { id: "m-2", sender: "agent", content: "Gợi ý", metadata: { products: [product] } },
            ],
          }
        : { id: "c-1", title: null, started_at: "2026-11-28T09:00:00.000Z" },
    );

    const detail = await conversationService.getMine("c-1");

    expect(detail).toMatchObject({ id: "c-1", title: "Hội thoại mới", startedAt: "2026-11-28T09:00:00.000Z" });
    expect(detail?.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(detail?.messages[1]?.products).toHaveLength(1);
  });

  it.each([403, 404])("không phải của mình / không có (%i) → null", async (status) => {
    fetchMock.mockRejectedValue(new ApiError(status, "x"));
    expect(await conversationService.getMine("c-9")).toBeNull();
  });

  it("lỗi máy chủ thì ném tiếp", async () => {
    fetchMock.mockRejectedValue(new ApiError(503, "Không kết nối được máy chủ"));
    await expect(conversationService.getMine("c-1")).rejects.toMatchObject({ status: 503 });
  });
});

describe("conversationService — phiên và lưu", () => {
  it("listMine đổi tiêu đề null thành 'Hội thoại mới'", async () => {
    fetchMock.mockResolvedValue([
      { id: "c-1", title: "Laptop học IT", started_at: "2026-11-28T09:00:00.000Z" },
      { id: "c-2", title: null, started_at: "2026-11-27T09:00:00.000Z" },
    ]);
    expect((await conversationService.listMine()).map((c) => c.title)).toEqual(["Laptop học IT", "Hội thoại mới"]);
  });

  it("create mở phiên chat, claim gán phiên khách vào tài khoản", async () => {
    fetchMock.mockResolvedValueOnce({ id: "c-new", channel: "chat" }).mockResolvedValueOnce({ claimed: 2 });
    expect(await conversationService.create()).toBe("c-new");
    expect(await conversationService.claim()).toBe(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/conversations", { method: "POST", body: { channel: "chat" } });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/conversations/claim", { method: "POST" });
  });
});
