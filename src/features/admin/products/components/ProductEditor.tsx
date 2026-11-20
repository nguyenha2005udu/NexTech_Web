"use client";

// FDD 7.2 — Modal Thêm / Sửa sản phẩm (design/admin/03 §2, ảnh 05). 4 tab; luồng 2 bước (✅Q-P3, §2.6):
//   Thêm: chỉ tab cơ bản → tạo xong chuyển URL sang ?modal=edit&id=<id> để thêm ảnh / thông số / tag.
//   Sửa: tab cơ bản lưu bằng nút "Lưu thay đổi"; 3 tab còn lại ghi ngay khi thao tác.
// SP ngừng bán (partial, §2.7): chỉ có dữ liệu dòng list → khoá 3 tab, chỉ gửi trường đã đổi.
import { useState } from "react";
import { Alert, App, Button, Form, Modal, Tabs, Tooltip } from "antd";
import type { AdminProductImage, AdminProductSpec, AdminProductTag } from "@/entities/product";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { useFormAction } from "@/hooks/useFormAction";
import { saveProduct } from "../actions";
import { changedFields, type ProductBasicFormValues } from "../product.rules";
import { ImageUploader } from "./ImageUploader";
import { ProductBasicTab } from "./ProductBasicTab";
import { SpecEditor } from "./SpecEditor";
import { TagEditor } from "./TagEditor";
import styles from "./products.module.css";

export type ProductEditorProps = {
  initialValues: ProductBasicFormValues;
  categories: ReadonlyArray<{ id: string; name: string }>;
  brands: readonly string[];
} & (
  | { mode: "create" }
  | {
      mode: "edit";
      productId: string;
      /** SP ngừng bán: không tải được danh mục / mô tả / ảnh / thông số / tag. */
      partial: boolean;
      images: readonly AdminProductImage[];
      specs: readonly AdminProductSpec[];
      tags: readonly AdminProductTag[];
    }
);

type TabKey = "basic" | "images" | "specs" | "tags";

const PARTIAL_NOTICE =
  "Sản phẩm đang ngừng bán: chưa tải được mô tả, danh mục, ảnh, thông số, tag. Bật “Đang bán” rồi lưu để sửa đầy đủ.";

export function ProductEditor(props: Readonly<ProductEditorProps>) {
  const { initialValues, categories, brands } = props;
  const [form] = Form.useForm<ProductBasicFormValues>();
  const { pending, run } = useFormAction(form);
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();
  const [tab, setTab] = useState<TabKey>("basic");

  const isEdit = props.mode === "edit";
  const partial = isEdit && props.partial;
  const close = () => setParams({ modal: undefined, id: undefined });

  function submit(values: ProductBasicFormValues) {
    if (props.mode === "create") {
      run(
        () => saveProduct(null, values),
        (result) => {
          message.success(values.isActive === false ? "Đã tạo sản phẩm" : "Đã tạo sản phẩm, tiếp tục thêm ảnh");
          setParams({ modal: "edit", id: result.data.id });
        },
      );
      return;
    }
    const payload = props.partial ? changedFields(initialValues, values) : values;
    if (Object.keys(payload).length === 0) {
      message.info("Chưa có thay đổi");
      return;
    }
    run(
      () => saveProduct(props.productId, payload),
      () => {
        message.success("Đã lưu sản phẩm");
        close();
      },
    );
  }

  const lockedReason = !isEdit ? "Lưu sản phẩm trước" : partial ? "Bật “Đang bán” rồi lưu để sửa" : undefined;
  const lockedLabel = (label: string) =>
    lockedReason ? (
      <Tooltip title={lockedReason}>
        <span>{label}</span>
      </Tooltip>
    ) : (
      label
    );

  const footer =
    tab === "basic"
      ? [
          <Button key="cancel" onClick={close}>
            Huỷ
          </Button>,
          <Button key="submit" type="primary" loading={pending} onClick={() => form.submit()}>
            {isEdit ? "Lưu thay đổi" : "Thêm sản phẩm"}
          </Button>,
        ]
      : [
          <Button key="close" onClick={close}>
            Đóng
          </Button>,
        ];

  return (
    <Modal open title={isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"} width={560} footer={footer} onCancel={close} destroyOnHidden>
      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as TabKey)}
        items={[
          {
            key: "basic",
            label: "Thông tin cơ bản",
            // forceRender: form luôn gắn vào Form.useForm kể cả khi đang ở tab khác
            forceRender: true,
            children: (
              <>
                {partial && <Alert type="warning" showIcon title={PARTIAL_NOTICE} className={styles.alert} />}
                <ProductBasicTab
                  form={form}
                  initialValues={initialValues}
                  categories={categories}
                  brands={brands}
                  categoryOptional={partial}
                  onSubmit={submit}
                />
              </>
            ),
          },
          {
            key: "images",
            label: lockedLabel("Ảnh"),
            disabled: !!lockedReason,
            children: props.mode === "edit" && <ImageUploader productId={props.productId} initialImages={props.images} />,
          },
          {
            key: "specs",
            label: lockedLabel("Thông số"),
            disabled: !!lockedReason,
            children: props.mode === "edit" && <SpecEditor productId={props.productId} initialSpecs={props.specs} />,
          },
          {
            key: "tags",
            label: lockedLabel("Tags"),
            disabled: !!lockedReason,
            children: props.mode === "edit" && <TagEditor productId={props.productId} initialTags={props.tags} />,
          },
        ]}
      />
    </Modal>
  );
}
