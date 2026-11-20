"use client";

// FDD 7.1 — Toolbar: tìm theo tên, lọc trạng thái, nút thêm (design/admin/02 §1.2). Trạng thái nằm trên URL.
import { Button, Input, Select } from "antd";
import { PlusIcon } from "@/components/ui/icons";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { useSearchParamInput } from "@/hooks/useSearchParamInput";
import { CATEGORY_STATUS_OPTIONS } from "../category.rules";
import styles from "./categories.module.css";

const STATUS_OPTIONS = [{ value: "", label: "Tất cả trạng thái" }, ...CATEGORY_STATUS_OPTIONS];

export function CategoryToolbar() {
  const { get, setParams } = useAdminListParams();
  const [query, setQuery] = useSearchParamInput("q");

  return (
    <div className={styles.toolbar}>
      <Input
        className={styles.search}
        placeholder="Tìm danh mục..."
        aria-label="Tìm danh mục"
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={100}
      />
      <Select
        className={styles.statusSelect}
        aria-label="Lọc trạng thái"
        value={get("status") ?? ""}
        options={STATUS_OPTIONS}
        onChange={(status: string) => setParams({ status })}
      />
      <Button
        type="primary"
        className={styles.addButton}
        icon={<PlusIcon size={14} />}
        onClick={() => setParams({ modal: "create", id: undefined })}
      >
        Thêm danh mục
      </Button>
    </div>
  );
}
