"use client";

// FDD 2.2 — Không có kết quả (Figma 01.04)
import { Button } from "antd";
import { SearchIcon } from "@/components/ui/icons";
import { useProductFilters } from "../hooks/useProductFilters";
import styles from "./Listing.module.css";

export function EmptyResult() {
  const { clearFilters } = useProductFilters();
  return (
    <div className={styles.empty} role="status">
      <SearchIcon />
      <h2 className={styles.emptyTitle}>Thử từ khóa khác</h2>
      <p className={styles.emptyText}>Bạn có thể bỏ bớt bộ lọc hoặc tìm theo thương hiệu và cấu hình.</p>
      <Button type="primary" onClick={clearFilters} className={styles.emptyButton}>
        Xóa bộ lọc
      </Button>
    </div>
  );
}
