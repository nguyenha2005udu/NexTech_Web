// FDD 5.1.1 — Đầu vào của placeOrder. Client chỉ gửi id + số lượng; giá, phí, giảm giá do server tính.
import { z } from "zod";

/** Khớp giới hạn của giỏ (MAX_QUANTITY_PER_ITEM ở feature cart). */
export const MAX_QUANTITY_PER_LINE = 10;
export const MAX_LINES_PER_ORDER = 20;

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
      }),
    )
    .min(1, "Chưa có sản phẩm nào để đặt")
    .max(MAX_LINES_PER_ORDER, `Mỗi đơn tối đa ${MAX_LINES_PER_ORDER} sản phẩm`)
    .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, "Sản phẩm bị lặp trong đơn"),
  addressId: z.string().min(1, "Chọn địa chỉ giao hàng"),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(32)
    .nullish()
    .transform((v) => v || null),
  paymentMethod: z.enum(["cod", "payos"], { message: "Chọn phương thức thanh toán" }),
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;
