// FDD 7.2 — Ràng buộc form sản phẩm, khớp DTO catalog-service (design/admin/03 §2, §4).
// Backend trả lỗi validate bằng tiếng Anh nên chặn ở đây trước. Dùng cho antd Form (zodRule) lẫn Server Action.
import { z } from "zod";
import type { ProductPayload } from "@/entities/product";

export const productIdSchema = z.uuid("Mã không hợp lệ");

// ===== Tab "Thông tin cơ bản" =====
export const productNameSchema = z
  .string({ error: "Vui lòng nhập tên sản phẩm" })
  .trim()
  .min(1, "Vui lòng nhập tên sản phẩm")
  .max(255, "Tối đa 255 ký tự");
export const productCategorySchema = z.uuid({ error: "Vui lòng chọn danh mục" });
export const productBrandSchema = z.string().trim().max(100, "Tối đa 100 ký tự").optional();
export const productPriceSchema = z
  .number({ error: "Vui lòng nhập giá" })
  .int("Giá phải là số nguyên")
  .positive("Giá phải lớn hơn 0");
export const productDescriptionSchema = z.string().trim().max(5000, "Tối đa 5000 ký tự").optional();
export const productStockSchema = z
  .number({ error: "Vui lòng nhập tồn kho" })
  .int("Tồn kho phải là số nguyên")
  .min(0, "Tồn kho không được âm");

export const productBasicSchema = z.object({
  name: productNameSchema,
  categoryId: productCategorySchema,
  brand: productBrandSchema,
  price: productPriceSchema,
  description: productDescriptionSchema,
  stockQuantity: productStockSchema,
  isActive: z.boolean({ error: "Trạng thái không hợp lệ" }),
});
export type ProductBasicValues = z.input<typeof productBasicSchema>;
export type ProductBasicInput = z.output<typeof productBasicSchema>;

/** Sửa: mọi trường tuỳ chọn — SP ngừng bán chỉ gửi trường đã đổi (§2.7). */
export const productUpdateSchema = productBasicSchema.partial();

/**
 * Form (camelCase) → body backend (snake_case) — một chỗ duy nhất. Trường `undefined` bị bỏ khi gửi JSON.
 * Thêm mới: thương hiệu / mô tả rỗng thì không gửi. Sửa: gửi "" để xoá giá trị cũ (backend lưu `brand` rỗng = null).
 */
export function toProductBody(v: Partial<ProductBasicInput>, mode: "create" | "edit"): ProductPayload {
  const optional = (s: string | undefined) => (mode === "create" ? s || undefined : s);
  return {
    name: v.name,
    category_id: v.categoryId,
    brand: optional(v.brand),
    price: v.price,
    description: optional(v.description),
    stock_quantity: v.stockQuantity,
    is_active: v.isActive,
  };
}

// ===== Tab "Thông số" =====
export const productSpecSchema = z.object({
  key: z.string({ error: "Nhập tên thông số" }).trim().min(1, "Nhập tên thông số").max(100, "Tối đa 100 ký tự"),
  value: z.string({ error: "Nhập giá trị" }).trim().min(1, "Nhập giá trị").max(500, "Tối đa 500 ký tự"),
  unit: z.string().trim().max(50, "Tối đa 50 ký tự").optional(),
});
export type ProductSpecValues = z.input<typeof productSpecSchema>;

// ===== Tab "Tags" =====
export const productTagSchema = z.string().trim().min(1, "Nhập tên tag").max(100, "Tối đa 100 ký tự");

// ===== Tab "Ảnh" — khớp ParseFilePipe của backend (≤ 5MB, jpg/jpeg/png/webp/gif) =====
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_TYPES: readonly string[] = IMAGE_ACCEPT.split(",");

/** Kiểm file ảnh trước khi gửi; trả câu lỗi hoặc `null` nếu hợp lệ. */
export function imageFileError(file: Pick<File, "type" | "size">): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF";
  if (file.size > MAX_IMAGE_BYTES) return "Ảnh tối đa 5MB";
  if (file.size === 0) return "File ảnh rỗng";
  return null;
}

export const imageUrlSchema = z
  .url({ protocol: /^https?$/, error: "Nhập URL ảnh bắt đầu bằng http:// hoặc https://" })
  .max(2000, "URL tối đa 2000 ký tự");
