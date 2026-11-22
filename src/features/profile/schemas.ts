import { z } from "zod";

// FDD 1.2.1 — schema dùng chung cho form (client) và Server Action (server).
// Giới hạn khớp UpdateMeDto / UpdateProfileDto của identity-service (profile.dto.ts).

export const fullNameSchema = z
  .string({ error: "Vui lòng nhập họ và tên" })
  .trim()
  .min(2, "Họ và tên cần ít nhất 2 ký tự")
  .max(150, "Họ và tên tối đa 150 ký tự");

/** Để trống = không đổi (backend không nhận chuỗi rỗng cho số điện thoại). */
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[0-9+ ]{8,15}$/.test(v), "Số điện thoại không hợp lệ");

export const profileFormSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema.default(""),
  userSegment: z.string().trim().max(50, "Tối đa 50 ký tự").nullish(),
  occupation: z.string().trim().max(100, "Tối đa 100 ký tự").nullish(),
  ageRange: z.string().trim().max(20, "Tối đa 20 ký tự").nullish(),
  interests: z.array(z.string().trim().min(1).max(50, "Mỗi sở thích tối đa 50 ký tự")).max(20, "Tối đa 20 sở thích").default([]),
});
export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;

/** Body `PUT /api/users/me`. Số điện thoại trống thì bỏ khỏi body. */
export function toAccountBody(v: ProfileFormValues) {
  return { full_name: v.fullName, ...(v.phone && { phone_number: v.phone }) };
}

/** Body `PUT /api/users/me/profile`. Ô trống thì bỏ khỏi body để giữ nguyên giá trị cũ. */
export function toShoppingBody(v: ProfileFormValues) {
  return {
    ...(v.userSegment && { user_segment: v.userSegment }),
    ...(v.occupation && { occupation: v.occupation }),
    ...(v.ageRange && { age_range: v.ageRange }),
    interests: v.interests,
  };
}
