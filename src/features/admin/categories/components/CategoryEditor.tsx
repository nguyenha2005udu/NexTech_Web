"use client";

// FDD 7.1 — Nối Modal với Server Action và URL (design/admin/02 §2.3): Lưu → saveCategory → đóng (bỏ ?modal).
// Chỉ render khi URL có ?modal=… nên form luôn gắn với Modal (không cảnh báo useForm rời).
import { App, Form } from "antd";
import type { Industry } from "@/entities/category";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { useFormAction } from "@/hooks/useFormAction";
import { saveCategory } from "../actions";
import type { CategoryFormValues } from "../schemas";
import { CategoryFormModal } from "./CategoryFormModal";

export interface CategoryEditorProps {
  mode: "create" | "edit";
  /** Có khi sửa. */
  categoryId?: string;
  initialValues: CategoryFormValues;
  industries: readonly Industry[];
}

export function CategoryEditor({ mode, categoryId, initialValues, industries }: Readonly<CategoryEditorProps>) {
  const [form] = Form.useForm<CategoryFormValues>();
  const { pending, run } = useFormAction(form);
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();

  const close = () => setParams({ modal: undefined, id: undefined });

  return (
    <CategoryFormModal
      form={form}
      mode={mode}
      initialValues={initialValues}
      industries={industries}
      pending={pending}
      onClose={close}
      onSubmit={(values) =>
        run(
          () => saveCategory(categoryId ?? null, values),
          () => {
            message.success("Đã lưu danh mục");
            close();
          },
        )
      }
    />
  );
}
