"use client";

// FDD 7.2 — Tab "Ảnh" (design/admin/03 §2.3): tải file lên hoặc dán URL, đặt ảnh chính, xoá. Mỗi thao tác gọi API ngay.
import { useState, useTransition } from "react";
import Image from "next/image";
import { App, Button, Input, Popconfirm, Tag, Upload } from "antd";
import type { AdminProductImage } from "@/entities/product";
import { PlusIcon } from "@/components/ui/icons";
import { addProductImage, removeProductImage, setPrimaryImage } from "../actions";
import { IMAGE_ACCEPT, imageFileError, imageUrlSchema } from "../schemas";
import styles from "./products.module.css";

/** Sau khi xoá ảnh chính, backend chọn ảnh có `sort_order` nhỏ nhất làm ảnh chính — làm giống ở state. */
function afterRemove(images: readonly AdminProductImage[], removed: AdminProductImage): AdminProductImage[] {
  const rest = images.filter((img) => img.id !== removed.id);
  if (!removed.is_primary || rest.length === 0) return rest;
  const next = [...rest].sort((a, b) => a.sort_order - b.sort_order)[0];
  return rest.map((img) => ({ ...img, is_primary: img.id === next?.id }));
}

export function ImageUploader({
  productId,
  initialImages,
}: Readonly<{ productId: string; initialImages: readonly AdminProductImage[] }>) {
  const [images, setImages] = useState<AdminProductImage[]>([...initialImages]);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  function add(source: { file: File } | { imageUrl: string }) {
    const form = new FormData();
    form.append("productId", productId);
    if ("file" in source) form.append("file", source.file);
    else form.append("imageUrl", source.imageUrl);
    form.append("isPrimary", images.length === 0 ? "true" : "false"); // ảnh đầu tiên là ảnh chính

    startTransition(async () => {
      const result = await addProductImage(form);
      if (!result.ok) {
        if (result.fieldErrors?.imageUrl) setUrlError(result.fieldErrors.imageUrl);
        else message.warning(result.message);
        return;
      }
      const added = result.data;
      setImages((prev) => [...prev.map((img) => (added.is_primary ? { ...img, is_primary: false } : img)), added]);
      if ("imageUrl" in source) setUrl("");
      message.success("Đã thêm ảnh");
    });
  }

  function addUrl() {
    const parsed = imageUrlSchema.safeParse(url.trim());
    if (!parsed.success) {
      setUrlError(parsed.error.issues[0]?.message);
      return;
    }
    add({ imageUrl: parsed.data });
  }

  function makePrimary(image: AdminProductImage) {
    startTransition(async () => {
      const result = await setPrimaryImage(productId, image.id);
      if (!result.ok) return void message.warning(result.message);
      setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === image.id })));
    });
  }

  async function remove(image: AdminProductImage) {
    const result = await removeProductImage(productId, image.id);
    if (!result.ok) return void message.warning(result.message);
    setImages((prev) => afterRemove(prev, image));
    message.success("Đã xoá ảnh");
  }

  return (
    <div>
      <p className={styles.tabNote}>Ảnh JPG, PNG, WEBP hoặc GIF, tối đa 5MB. Ảnh đầu tiên tự thành ảnh chính.</p>
      <ul className={styles.imageGrid} aria-label="Ảnh sản phẩm">
        {images.map((image) => (
          <li key={image.id} className={styles.imageCard}>
            <div className={styles.imageFrame}>
              <Image src={image.image_url} alt="" width={104} height={104} unoptimized />
              {image.is_primary && (
                <Tag color="blue" variant="solid" className={styles.primaryBadge}>
                  Ảnh chính
                </Tag>
              )}
            </div>
            <div className={styles.imageActions}>
              {!image.is_primary && (
                <Button type="link" size="small" className={styles.linkButton} disabled={pending} onClick={() => makePrimary(image)}>
                  Đặt làm chính
                </Button>
              )}
              <Popconfirm
                title="Xoá ảnh này?"
                okText="Xoá"
                okButtonProps={{ danger: true }}
                cancelText="Huỷ"
                onConfirm={() => remove(image)}
              >
                <Button type="link" size="small" danger className={styles.linkButton}>
                  Xoá ảnh
                </Button>
              </Popconfirm>
            </div>
          </li>
        ))}
        <li>
          <Upload
            accept={IMAGE_ACCEPT}
            listType="picture-card"
            showUploadList={false}
            disabled={pending}
            beforeUpload={(file) => {
              const error = imageFileError(file);
              if (error) message.warning(error);
              else add({ file });
              return Upload.LIST_IGNORE; // tự gửi qua Server Action, không để antd upload
            }}
          >
            <span>
              <PlusIcon size={16} />
              <br />
              {pending ? "Đang xử lý..." : "Tải ảnh lên"}
            </span>
          </Upload>
        </li>
      </ul>
      <div className={styles.urlRow}>
        <Input
          placeholder="Hoặc dán URL ảnh (https://...)"
          aria-label="URL ảnh"
          value={url}
          status={urlError ? "error" : undefined}
          onChange={(e) => {
            setUrl(e.target.value);
            setUrlError(undefined);
          }}
          onPressEnter={addUrl}
        />
        <Button onClick={addUrl} loading={pending} disabled={!url.trim()}>
          Thêm
        </Button>
      </div>
      {urlError && (
        <p role="alert" className={styles.stockLow}>
          {urlError}
        </p>
      )}
    </div>
  );
}
