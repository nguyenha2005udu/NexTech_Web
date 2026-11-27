// FDD 8.4 — zod cho Server Action khoá / đổi vai trò người dùng (design/admin/07 §3.3).
import { z } from "zod";

export const userIdSchema = z.uuid("Mã người dùng không hợp lệ");

export const updateUserSchema = z
  .object({
    id: userIdSchema,
    role: z.enum(["user", "admin"], "Vai trò không hợp lệ").optional(),
    is_active: z.boolean("Trạng thái không hợp lệ").optional(),
  })
  .refine((v) => v.role !== undefined || v.is_active !== undefined, "Chưa có thay đổi nào");

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
