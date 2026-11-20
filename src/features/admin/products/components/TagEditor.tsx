"use client";

// FDD 7.2 — Tab "Tags" (design/admin/03 §2.5): gõ rồi Enter để gắn, bấm × để gỡ. Tag mới tự tạo ở backend.
// Backend không có API liệt kê tag nên không có gợi ý.
import { useState, useTransition } from "react";
import { App, Select } from "antd";
import type { AdminProductTag } from "@/entities/product";
import { addProductTag, removeProductTag } from "../actions";
import { productTagSchema } from "../schemas";
import styles from "./products.module.css";

export function TagEditor({
  productId,
  initialTags,
}: Readonly<{ productId: string; initialTags: readonly AdminProductTag[] }>) {
  const [tags, setTags] = useState<AdminProductTag[]>([...initialTags]);
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  function add(raw: string) {
    const parsed = productTagSchema.safeParse(raw);
    if (!parsed.success) return void message.warning(parsed.error.issues[0]?.message ?? "Tag không hợp lệ");
    if (tags.some((t) => t.name === parsed.data)) return;
    startTransition(async () => {
      const result = await addProductTag(productId, parsed.data);
      if (!result.ok) return void message.warning(result.message);
      setTags((prev) => (prev.some((t) => t.id === result.data.id) ? prev : [...prev, result.data]));
    });
  }

  function remove(name: string) {
    const tag = tags.find((t) => t.name === name);
    if (!tag) return;
    startTransition(async () => {
      const result = await removeProductTag(productId, tag.id);
      if (!result.ok) return void message.warning(result.message);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    });
  }

  return (
    <div>
      <p className={styles.tabNote}>Gõ tên tag rồi nhấn Enter để gắn; bấm × để gỡ.</p>
      <Select
        mode="tags"
        className={styles.fullWidth}
        aria-label="Tags của sản phẩm"
        placeholder="VD: Học tập, Gaming"
        value={tags.map((t) => t.name)}
        open={false}
        loading={pending}
        onSelect={(value: string) => add(value)}
        onDeselect={(value: string) => remove(value)}
        tokenSeparators={[","]}
      />
    </div>
  );
}
