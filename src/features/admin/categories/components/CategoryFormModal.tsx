"use client";

// FDD 7.1 — Modal Thêm / Sửa danh mục (design/admin/02 §2, ảnh 03). Chỉ hiển thị + validate; gửi ở CategoryEditor.
import { Checkbox, Form, Input, InputNumber, Modal, Select } from "antd";
import type { FormInstance } from "antd";
import type { Industry } from "@/entities/category";
import { zodRule } from "@/lib/zod-rule";
import {
  categoryIconSchema,
  categoryNameSchema,
  categorySortOrderSchema,
  type CategoryFormValues,
} from "../schemas";
import styles from "./categories.module.css";

export interface CategoryFormModalProps {
  form: FormInstance<CategoryFormValues>;
  mode: "create" | "edit";
  initialValues: CategoryFormValues;
  industries: readonly Industry[];
  pending: boolean;
  onSubmit: (values: CategoryFormValues) => void;
  onClose: () => void;
}

export function CategoryFormModal({
  form,
  mode,
  initialValues,
  industries,
  pending,
  onSubmit,
  onClose,
}: Readonly<CategoryFormModalProps>) {
  return (
    <Modal
      open
      title={mode === "create" ? "Thêm danh mục" : "Sửa danh mục"}
      width={440}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={pending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false} initialValues={initialValues} onFinish={onSubmit}>
        <Form.Item name="name" label="Tên danh mục" rules={[zodRule(categoryNameSchema)]}>
          <Input placeholder="Ví dụ: Laptop" maxLength={100} autoFocus />
        </Form.Item>
        <Form.Item name="icon" label="Icon (emoji hoặc URL)" rules={[zodRule(categoryIconSchema)]}>
          <Input maxLength={500} />
        </Form.Item>
        <Form.Item name="sortOrder" label="Thứ tự hiển thị" rules={[zodRule(categorySortOrderSchema)]}>
          <InputNumber min={0} precision={0} className={styles.fullWidth} />
        </Form.Item>
        <Form.Item name="industryId" label="Ngành học (không bắt buộc)">
          <Select
            allowClear
            showSearch={{ optionFilterProp: "label" }}
            placeholder="Chọn ngành học"
            options={industries.map((i) => ({ value: i.id, label: i.name }))}
          />
        </Form.Item>
        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Hiển thị</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
