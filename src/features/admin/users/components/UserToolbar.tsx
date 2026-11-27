"use client";

// FDD 8.4 — Toolbar: tìm theo tên / email / SĐT, lọc vai trò, lọc trạng thái (design/admin/07 §1.2).
// Không có nút thêm: backend không có API tạo người dùng phía admin.
import { Input, Select } from "antd";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { useSearchParamInput } from "@/hooks/useSearchParamInput";
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from "../user.rules";
import styles from "./users.module.css";

const ROLE_OPTIONS = [{ value: "", label: "Tất cả vai trò" }, ...USER_ROLE_OPTIONS];
const STATUS_OPTIONS = [{ value: "", label: "Tất cả trạng thái" }, ...USER_STATUS_OPTIONS];

export function UserToolbar() {
  const { get, setParams } = useAdminListParams();
  const [query, setQuery] = useSearchParamInput("q");

  return (
    <div className={styles.toolbar}>
      <Input
        className={styles.search}
        placeholder="Tìm tên, email, SĐT..."
        aria-label="Tìm người dùng"
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={100}
      />
      <Select
        className={styles.filterSelect}
        aria-label="Lọc vai trò"
        value={get("role") ?? ""}
        options={ROLE_OPTIONS}
        onChange={(role: string) => setParams({ role })}
      />
      <Select
        className={styles.filterSelect}
        aria-label="Lọc trạng thái"
        value={get("status") ?? ""}
        options={STATUS_OPTIONS}
        onChange={(status: string) => setParams({ status })}
      />
    </div>
  );
}
