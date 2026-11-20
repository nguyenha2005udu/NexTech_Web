"use client";

// FDD 7.2 — Tab "Thông tin cơ bản" (design/admin/03 §2.2, ảnh 05). Chỉ hiển thị + validate; gửi ở ProductEditor.
import { AutoComplete, Checkbox, Col, Form, Input, InputNumber, Row, Select } from "antd";
import type { FormInstance } from "antd";
import { formatNumber } from "@/lib/format";
import { zodRule } from "@/lib/zod-rule";
import type { ProductBasicFormValues } from "../product.rules";
import {
  productBrandSchema,
  productCategorySchema,
  productDescriptionSchema,
  productNameSchema,
  productPriceSchema,
  productStockSchema,
} from "../schemas";
import styles from "./products.module.css";

export interface ProductBasicTabProps {
  form: FormInstance<ProductBasicFormValues>;
  initialValues: ProductBasicFormValues;
  categories: ReadonlyArray<{ id: string; name: string }>;
  brands: readonly string[];
  /** SP ngừng bán chưa tải được danh mục → không bắt buộc chọn (§2.7). */
  categoryOptional: boolean;
  onSubmit: (values: ProductBasicFormValues) => void;
}

const parseDigits = (value: string | undefined) => value?.replace(/\D/g, "") ?? "";

export function ProductBasicTab({
  form,
  initialValues,
  categories,
  brands,
  categoryOptional,
  onSubmit,
}: Readonly<ProductBasicTabProps>) {
  return (
    <Form form={form} layout="vertical" requiredMark={false} initialValues={initialValues} onFinish={onSubmit}>
      <Form.Item name="name" label="Tên sản phẩm" rules={[zodRule(productNameSchema)]}>
        <Input placeholder="VD: Laptop UltraBook Pro 14" maxLength={255} autoFocus />
      </Form.Item>
      <Row gutter={12}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="categoryId"
            label="Danh mục"
            rules={categoryOptional ? [] : [zodRule(productCategorySchema)]}
          >
            <Select
              placeholder="Chọn danh mục"
              showSearch={{ optionFilterProp: "label" }}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="brand" label="Thương hiệu" rules={[zodRule(productBrandSchema)]}>
            <AutoComplete
              placeholder="VD: Apple"
              maxLength={100}
              options={brands.map((b) => ({ value: b }))}
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.value ?? "").toLowerCase().includes(input.trim().toLowerCase()),
              }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="price" label="Giá (₫)" rules={[zodRule(productPriceSchema)]}>
        <InputNumber<number>
          min={0}
          precision={0}
          placeholder="0"
          className={styles.fullWidth}
          formatter={(value) => (value === undefined || value === null || `${value}` === "" ? "" : formatNumber(Number(value)))}
          parser={(value) => Number(parseDigits(value))}
        />
      </Form.Item>
      <Form.Item name="description" label="Mô tả" rules={[zodRule(productDescriptionSchema)]}>
        <Input.TextArea rows={3} placeholder="Mô tả sản phẩm..." maxLength={5000} />
      </Form.Item>
      <Form.Item name="stockQuantity" label="Tồn kho" rules={[zodRule(productStockSchema)]}>
        <InputNumber<number> min={0} precision={0} className={styles.fullWidth} />
      </Form.Item>
      <Form.Item name="isActive" valuePropName="checked">
        <Checkbox>Đang bán</Checkbox>
      </Form.Item>
    </Form>
  );
}
