/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { conversationService } from "@/entities/conversation/service";
import { ApiError } from "@/lib/api/http";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { saveGuestConversations, sendAssistantMessage, startAssistantConversation } from "./actions";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("@/entities/conversation/service", () => ({
  conversationService: { create: jest.fn(), sendMessage: jest.fn(), claim: jest.fn() },
}));
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
  return { ApiError };
});

const mockSession = jest.mocked(getSessionUser);
const mockCreate = jest.mocked(conversationService.create);
const mockSend = jest.mocked(conversationService.sendMessage);
const mockClaim = jest.mocked(conversationService.claim);

const user: SessionUser = { id: "u-1", email: "a@example.com", full_name: "A", role: "user", avatar_url: null };
const C1 = "1f2e3d4c-5b6a-4978-8a1b-2c3d4e5f6a7b";
const C2 = "2a3b4c5d-6e7f-4a8b-9c0d-1e2f3a4b5c6d";
const reply = { id: "m-2", role: "assistant" as const, text: "Gợi ý tai nghe Sony" };

beforeEach(() => {
  mockSession.mockResolvedValue(null);
  mockCreate.mockResolvedValue(C2);
  mockSend.mockResolvedValue(reply);
  mockClaim.mockResolvedValue(1);
});
afterEach(() => jest.clearAllMocks());

describe("startAssistantConversation", () => {
  it("khách cũng mở được phiên (FDD 3.1)", async () => {
    expect(await startAssistantConversation()).toEqual({ ok: true, data: { conversationId: C2 } });
  });

  it("assistant-service lỗi thì trả thông báo của backend", async () => {
    mockCreate.mockRejectedValue(new ApiError(503, "Trợ lý AI chưa sẵn sàng", "NT-AST-1003"));
    expect(await startAssistantConversation()).toEqual({ ok: false, message: "Trợ lý AI chưa sẵn sàng" });
  });
});

describe("sendAssistantMessage", () => {
  it("gửi câu hỏi đã cắt khoảng trắng và trả câu trả lời thật của backend", async () => {
    const result = await sendAssistantMessage({ conversationId: C1, content: "  tai nghe dưới 2 triệu  " });
    expect(result).toEqual({ ok: true, data: { conversationId: C1, reply } });
    expect(mockSend).toHaveBeenCalledWith(C1, "tai nghe dưới 2 triệu");
  });

  it.each([
    ["câu hỏi rỗng", { conversationId: C1, content: "   " }],
    ["câu hỏi quá 2000 ký tự", { conversationId: C1, content: "a".repeat(2001) }],
    ["id phiên không phải UUID", { conversationId: "c-1", content: "chào" }],
    ["thiếu id phiên", { content: "chào" }],
  ])("từ chối khi %s, không gọi backend", async (_label, input) => {
    expect(await sendAssistantMessage(input)).toMatchObject({ ok: false });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("phiên không còn thuộc người gọi (403) thì mở phiên mới và gửi lại một lần", async () => {
    mockSend.mockRejectedValueOnce(new ApiError(403, "Bạn không có quyền", "NT-AST-1002"));
    const result = await sendAssistantMessage({ conversationId: C1, content: "chào" });
    expect(result).toEqual({ ok: true, data: { conversationId: C2, reply } });
    expect(mockSend).toHaveBeenLastCalledWith(C2, "chào");
  });

  it("AI quá giờ (504) thì báo lỗi, không mở phiên mới", async () => {
    mockSend.mockRejectedValue(new ApiError(504, "Trợ lý AI phản hồi quá lâu, vui lòng thử lại", "NT-AST-1005"));
    expect(await sendAssistantMessage({ conversationId: C1, content: "chào" })).toEqual({
      ok: false,
      message: "Trợ lý AI phản hồi quá lâu, vui lòng thử lại",
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("saveGuestConversations", () => {
  it("khách chưa đăng nhập bị chuyển tới /login", async () => {
    await expect(saveGuestConversations()).rejects.toThrow("REDIRECT:/login");
    expect(mockClaim).not.toHaveBeenCalled();
  });

  it("người dùng lưu được hội thoại khách và làm mới trang lịch sử", async () => {
    mockSession.mockResolvedValue(user);
    expect(await saveGuestConversations()).toEqual({ ok: true, data: { claimed: 1 } });
    expect(revalidatePath).toHaveBeenCalledWith("/assistant/history");
  });
});
