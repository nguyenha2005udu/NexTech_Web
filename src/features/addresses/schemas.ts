import { z } from "zod";

// FDD 1.2.2 — schema dùng chung cho form (client) và Server Action (server).
// Giới hạn khớp CreateAddressDto / UpdateAddressDto của identity-service (address.dto.ts).

export const recipientNameSchema = z
  .string({ error: "Vui lòng nhập tên người nhận" })
  .trim()
  .min(2, "Tên người nhận cần ít nhất 2 ký tự")
  .max(150, "Tên người nhận tối đa 150 ký tự");

export const phoneNumberSchema = z
  .string({ error: "Vui lòng nhập số điện thoại" })
  .trim()
  .regex(/^[0-9+ ]{8,15}$/, "Số điện thoại không hợp lệ");

export const fullAddressSchema = z
  .string({ error: "Vui lòng nhập địa chỉ" })
  .trim()
  .min(5, "Địa chỉ cần ít nhất 5 ký tự")
  .max(255, "Địa chỉ tối đa 255 ký tự");

export const addressFormSchema = z.object({
  recipientName: recipientNameSchema,
  phoneNumber: phoneNumberSchema,
  fullAddress: fullAddressSchema,
  isDefault: z.boolean().default(false),
});
export type AddressFormInput = z.input<typeof addressFormSchema>;
export type AddressFormValues = z.output<typeof addressFormSchema>;

export const addressIdSchema = z.object({ id: z.string().min(1, "Thiếu mã địa chỉ") });

/** Body `POST/PUT /api/users/me/addresses`. Không gửi `is_default: false` (backend không cần). */
export function toAddressBody(v: AddressFormValues) {
  return {
    recipient_name: v.recipientName,
    phone_number: v.phoneNumber,
    full_address: v.fullAddress,
    ...(v.isDefault && { is_default: true }),
  };
}
