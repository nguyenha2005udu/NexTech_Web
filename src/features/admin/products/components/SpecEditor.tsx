"use client";

// FDD 7.2 — Tab "Thông số" (design/admin/03 §2.4): sửa trực tiếp từng dòng, thêm, xoá. Mỗi thao tác gọi API ngay.
import { useState } from "react";
import { App, Button, Form, Input, Popconfirm } from "antd";
import type { AdminProductSpec } from "@/entities/product";
import { useFormAction } from "@/hooks/useFormAction";
import { zodRule } from "@/lib/zod-rule";
import { addProductSpec, removeProductSpec, updateProductSpec } from "../actions";
import { productSpecSchema, type ProductSpecValues } from "../schemas";
import styles from "./products.module.css";

const { key: keyRule, value: valueRule, unit: unitRule } = productSpecSchema.shape;

const toValues = (spec: AdminProductSpec): ProductSpecValues => ({
  key: spec.spec_key,
  value: spec.spec_value,
  unit: spec.spec_unit ?? "",
});

function SpecFields({ labelled }: Readonly<{ labelled: string }>) {
  return (
    <>
      <Form.Item name="key" rules={[zodRule(keyRule)]} className={styles.compactItem}>
        <Input placeholder="VD: RAM" aria-label={`Tên thông số ${labelled}`} maxLength={100} />
      </Form.Item>
      <Form.Item name="value" rules={[zodRule(valueRule)]} className={styles.compactItem}>
        <Input placeholder="VD: 16" aria-label={`Giá trị ${labelled}`} maxLength={500} />
      </Form.Item>
      <Form.Item name="unit" rules={[zodRule(unitRule)]} className={styles.compactItem}>
        <Input placeholder="GB" aria-label={`Đơn vị ${labelled}`} maxLength={50} />
      </Form.Item>
    </>
  );
}

function SpecRow({
  productId,
  spec,
  onSaved,
  onRemoved,
}: Readonly<{
  productId: string;
  spec: AdminProductSpec;
  onSaved: (spec: AdminProductSpec) => void;
  onRemoved: (id: string) => void;
}>) {
  const [form] = Form.useForm<ProductSpecValues>();
  const { pending, run } = useFormAction(form);
  const [dirty, setDirty] = useState(false);
  const { message } = App.useApp();

  async function remove() {
    const result = await removeProductSpec(productId, spec.id);
    if (!result.ok) return void message.warning(result.message);
    onRemoved(spec.id);
  }

  return (
    <Form
      form={form}
      initialValues={toValues(spec)}
      onValuesChange={() => setDirty(true)}
      onFinish={(values) =>
        run(
          () => updateProductSpec(productId, spec.id, values),
          (result) => {
            setDirty(false);
            onSaved(result.data);
            message.success("Đã lưu thông số");
          },
        )
      }
      className={styles.specGrid}
    >
      <SpecFields labelled={spec.spec_key} />
      <span className={styles.specRowActions}>
        <Button type="link" className={styles.linkButton} htmlType="submit" disabled={!dirty} loading={pending}>
          Lưu
        </Button>
        <Popconfirm title={`Xoá thông số “${spec.spec_key}”?`} okText="Xoá" okButtonProps={{ danger: true }} cancelText="Huỷ" onConfirm={remove}>
          <Button type="link" danger className={styles.linkButton}>
            Xoá
          </Button>
        </Popconfirm>
      </span>
    </Form>
  );
}

export function SpecEditor({
  productId,
  initialSpecs,
}: Readonly<{ productId: string; initialSpecs: readonly AdminProductSpec[] }>) {
  const [specs, setSpecs] = useState<AdminProductSpec[]>([...initialSpecs]);
  const [form] = Form.useForm<ProductSpecValues>();
  const { pending, run } = useFormAction(form);
  const { message } = App.useApp();

  return (
    <div>
      <div className={`${styles.specGrid} ${styles.specHead}`} aria-hidden="true">
        <span>Tên thông số</span>
        <span>Giá trị</span>
        <span>Đơn vị</span>
        <span />
      </div>
      <div className={styles.specList}>
        {specs.length === 0 && <p className={styles.tabNote}>Chưa có thông số nào.</p>}
        {specs.map((spec) => (
          <SpecRow
            key={spec.id}
            productId={productId}
            spec={spec}
            onSaved={(saved) => setSpecs((prev) => prev.map((s) => (s.id === saved.id ? saved : s)))}
            onRemoved={(id) => setSpecs((prev) => prev.filter((s) => s.id !== id))}
          />
        ))}
      </div>
      <Form
        form={form}
        className={`${styles.specGrid} ${styles.specAdd}`}
        onFinish={(values) =>
          run(
            () => addProductSpec(productId, values),
            (result) => {
              setSpecs((prev) => [...prev, result.data]);
              form.resetFields();
              message.success("Đã thêm thông số");
            },
          )
        }
      >
        <SpecFields labelled="mới" />
        <span className={styles.specRowActions}>
          <Button htmlType="submit" loading={pending}>
            + Thêm thông số
          </Button>
        </span>
      </Form>
    </div>
  );
}
