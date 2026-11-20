// FDD 7.1 — Ràng buộc form danh mục, khớp `CreateCategoryDto` của catalog-service (design/admin/02 §2.2, §4).
// Dùng cho cả antd Form (zodRule) lẫn Server Action. Backend trả lỗi validate bằng tiếng Anh nên phải chặn ở đây trước.
import { z } from "zod";

export const categoryNameSchema = z
  .string({ error: "Vui lòng nhập tên danh mục" })
  .trim()
  .min(1, "Vui lòng nhập tên danh mục")
  .max(100, "Tối đa 100 ký tự");

/** Rỗng → `null` để khi sửa xoá được icon cũ (backend chỉ bỏ qua khi `undefined`). */
export const categoryIconSchema = z
  .string()
  .trim()
  .max(500, "Tối đa 500 ký tự")
  .nullish()
  .transform((v) => (v ? v : null));

export const categorySortOrderSchema = z
  .number({ error: "Vui lòng nhập thứ tự hiển thị" })
  .int("Thứ tự phải là số nguyên")
  .min(0, "Thứ tự không được âm");

/** Bỏ chọn → `null` để khi sửa gỡ được ngành học cũ. */
export const categoryIndustryIdSchema = z
  .uuid("Ngành học không hợp lệ")
  .nullish()
  .transform((v) => v ?? null);

export const categoryFormSchema = z.object({
  name: categoryNameSchema,
  icon: categoryIconSchema,
  sortOrder: categorySortOrderSchema,
  industryId: categoryIndustryIdSchema,
  isActive: z.boolean({ error: "Trạng thái không hợp lệ" }),
});

/** Giá trị trong form (trước khi chuẩn hoá). */
export type CategoryFormValues = z.input<typeof categoryFormSchema>;

export const categoryIdSchema = z.uuid("Mã danh mục không hợp lệ");
