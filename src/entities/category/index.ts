// Chỉ export type (dùng được ở client). Service ở server: import từ "@/entities/category/service" | "/admin-service".
export type {
  AdminCategory,
  AdminCategoryQuery,
  Category,
  CategoryIconKey,
  CategoryPayload,
  Industry,
} from "./types";
