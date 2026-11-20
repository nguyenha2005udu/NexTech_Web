"use client";

// FDD 7.2 — Toolbar: tìm, lọc danh mục, lọc thương hiệu, nút thêm (design/admin/03 §1.2). Không có lọc trạng thái (✅Q-P5).
import { Button, Input, Select } from "antd";
import { PlusIcon } from "@/components/ui/icons";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { useSearchParamInput } from "@/hooks/useSearchParamInput";
import styles from "./products.module.css";

export interface ProductToolbarProps {
  categories: ReadonlyArray<{ id: string; name: string }>;
  brands: readonly string[];
}

export function ProductToolbar({ categories, brands }: Readonly<ProductToolbarProps>) {
  const { get, setParams } = useAdminListParams();
  const [query, setQuery] = useSearchParamInput("q");

  return (
    <div className={styles.toolbar}>
      <Input
        className={styles.search}
        placeholder="Tìm sản phẩm..."
        aria-label="Tìm sản phẩm"
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={255}
      />
      <Select
        className={styles.filterSelect}
        aria-label="Lọc danh mục"
        value={get("category") ?? ""}
        options={[{ value: "", label: "Tất cả danh mục" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        onChange={(category: string) => setParams({ category })}
      />
      <Select
        className={styles.filterSelect}
        aria-label="Lọc thương hiệu"
        showSearch={{ optionFilterProp: "label" }}
        value={get("brand") ?? ""}
        options={[{ value: "", label: "Tất cả thương hiệu" }, ...brands.map((b) => ({ value: b, label: b }))]}
        onChange={(brand: string) => setParams({ brand })}
      />
      <Button
        type="primary"
        className={styles.addButton}
        icon={<PlusIcon size={14} />}
        onClick={() => setParams({ modal: "create", id: undefined })}
      >
        Thêm sản phẩm
      </Button>
    </div>
  );
}
