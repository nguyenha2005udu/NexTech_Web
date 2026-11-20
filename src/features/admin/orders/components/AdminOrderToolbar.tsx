"use client";

// FDD 8.2.1 — Toolbar: tìm theo tên khách, lọc trạng thái (design/admin/04 §1.2). Không có nút thêm.
// ✅Q-O1: backend chỉ tìm theo tên khách → placeholder "Tìm theo tên khách..." (mockup: "mã đơn / khách", chờ BE-2).
import { Input, Select } from "antd";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { useSearchParamInput } from "@/hooks/useSearchParamInput";
import { ORDER_STATUS_OPTIONS } from "../order.rules";
import styles from "./orders.module.css";

const STATUS_OPTIONS = [{ value: "", label: "Tất cả trạng thái" }, ...ORDER_STATUS_OPTIONS];

export function AdminOrderToolbar() {
  const { get, setParams } = useAdminListParams();
  const [query, setQuery] = useSearchParamInput("q");

  return (
    <div className={styles.toolbar}>
      <Input
        className={styles.search}
        placeholder="Tìm theo tên khách..."
        aria-label="Tìm theo tên khách"
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
    </div>
  );
}
