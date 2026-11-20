"use client";

// FDD 8.3 — Toolbar: tìm mã, lọc trạng thái, nút thêm (design/admin/05 §1.2).
import { Button, Input, Select } from "antd";
import { PlusIcon } from "@/components/ui/icons";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { useSearchParamInput } from "@/hooks/useSearchParamInput";
import { COUPON_STATUS_OPTIONS } from "../coupon.rules";
import styles from "./coupons.module.css";

const STATUS_OPTIONS = [{ value: "", label: "Tất cả trạng thái" }, ...COUPON_STATUS_OPTIONS];

export function CouponToolbar() {
  const { get, setParams } = useAdminListParams();
  const [query, setQuery] = useSearchParamInput("q");

  return (
    <div className={styles.toolbar}>
      <Input
        className={styles.search}
        placeholder="Tìm mã..."
        aria-label="Tìm mã"
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={50}
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
        Thêm mã
      </Button>
    </div>
  );
}
