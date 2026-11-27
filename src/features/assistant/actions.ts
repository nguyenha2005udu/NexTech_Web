"use server";

// FDD 3.1–3.3 — Chat với trợ lý AI qua assistant-service. Server Action là endpoint công khai (mục 10.3):
// phiên + can("assistant:chat") (khách cũng được) → zod → gọi backend. Cookie `guest_id` do apiFetch chuyển.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { routes } from "@/config/routes";
import { CHAT_MESSAGE_MAX, type ChatMessage } from "@/entities/conversation";
import { conversationService } from "@/entities/conversation/service";
import { failed, invalid } from "@/lib/action-result";
import { ApiError } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import type { ActionFailure, ActionResult } from "@/types/action";

const sendSchema = z.object({
  conversationId: z.uuid(),
  content: z
    .string()
    .trim()
    .min(1, "Nhập câu hỏi của bạn")
    .max(CHAT_MESSAGE_MAX, `Câu hỏi tối đa ${CHAT_MESSAGE_MAX} ký tự`),
});

const FORBIDDEN: ActionFailure = { ok: false, message: "Bạn không có quyền dùng trợ lý AI" };

async function canChat(): Promise<boolean> {
  const user = await getSessionUser();
  return can(user?.role ?? "guest", "assistant:chat");
}

/** Phiên không còn thuộc người gọi (đăng xuất sau khi đã lưu, cookie khách bị xoá) hoặc không tồn tại. */
const isGone = (err: unknown) => err instanceof ApiError && (err.status === 403 || err.status === 404);

/** Mở phiên hội thoại trước câu hỏi đầu tiên (tách riêng để gửi lỗi thì thử lại vẫn đúng phiên). */
export async function startAssistantConversation(): Promise<ActionResult<{ conversationId: string }>> {
  if (!(await canChat())) return FORBIDDEN;
  try {
    return { ok: true, data: { conversationId: await conversationService.create() } };
  } catch (err) {
    return failed(err);
  }
}

/**
 * Gửi câu hỏi, nhận câu trả lời kèm sản phẩm thật (FDD 3.1–3.2). Phiên cũ không còn dùng được thì mở phiên mới
 * và gửi lại một lần; `conversationId` trả về là phiên thực sự đã dùng.
 */
export async function sendAssistantMessage(
  input: unknown,
): Promise<ActionResult<{ conversationId: string; reply: ChatMessage }>> {
  if (!(await canChat())) return FORBIDDEN;
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { content } = parsed.data;

  try {
    let conversationId = parsed.data.conversationId;
    let reply: ChatMessage;
    try {
      reply = await conversationService.sendMessage(conversationId, content);
    } catch (err) {
      if (!isGone(err)) throw err;
      conversationId = await conversationService.create();
      reply = await conversationService.sendMessage(conversationId, content);
    }
    return { ok: true, data: { conversationId, reply } };
  } catch (err) {
    return failed(err);
  }
}

/** FDD 3.3 — Lưu hội thoại khách của thiết bị này vào tài khoản vừa đăng nhập. */
export async function saveGuestConversations(): Promise<ActionResult<{ claimed: number }>> {
  await requirePermission("assistant:history");
  try {
    const claimed = await conversationService.claim();
    revalidatePath(routes.assistantHistory);
    return { ok: true, data: { claimed } };
  } catch (err) {
    return failed(err);
  }
}
