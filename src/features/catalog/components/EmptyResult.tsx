"use client";

// FDD 2.2 — Không có kết quả (Figma 01.04)
import { Button } from "antd";
import { SearchIcon } from "@/components/ui/icons";
import { hasActiveFilters } from "@/entities/product";
import { useProductFilters } from "../hooks/useProductFilters";
import styles from "./Listing.module.css";

type Props = { title?: string; text?: string };

export function EmptyResult({
  title = "Thử từ khóa khác",
  text = "Bạn có thể bỏ bớt bộ lọc hoặc tìm theo thương hiệu và cấu hình.",
}: Props) {
  const { filters, clearFilters } = useProductFilters();
  return (
    <div className={styles.empty} role="status">
      <SearchIcon />
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className={styles.emptyText}>{text}</p>
      {/* Chỉ hiện nút khi có điều kiện lọc để bỏ — tránh nút bấm không có tác dụng. */}
      {hasActiveFilters(filters) ? (
        <Button type="primary" onClick={clearFilters} className={styles.emptyButton}>
          Xóa bộ lọc
        </Button>
      ) : null}
    </div>
  );
}
