"use client";

// FDD 8.2.4 — Toolbar màn Thanh toán: lọc phương thức + trạng thái (design/admin/06 §1.2).
// Không có ô tìm (✅Q-T5), không có nút thêm.
import { Select } from "antd";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../payment.rules";
import styles from "./transactions.module.css";

const METHOD_OPTIONS = [{ value: "", label: "Tất cả phương thức" }, ...PAYMENT_METHOD_OPTIONS];
const STATUS_OPTIONS = [{ value: "", label: "Tất cả trạng thái" }, ...PAYMENT_STATUS_OPTIONS];

export function TransactionToolbar() {
  const { get, setParams } = useAdminListParams();

  return (
    <div className={styles.toolbar}>
      <Select
        className={styles.filterSelect}
        aria-label="Lọc phương thức"
        value={get("method") ?? ""}
        options={METHOD_OPTIONS}
        onChange={(method: string) => setParams({ method })}
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
