"use client";

// FDD 2.2 — Bộ lọc thương hiệu / khoảng giá / thông số (Figma 01.02–01.04)
import { useState } from "react";
import { Button, Checkbox, InputNumber } from "antd";
import { SlidersIcon } from "@/components/ui/icons";
import type { FilterFacets } from "@/entities/product";
import { formatNumber } from "@/lib/format";
import { useProductFilters, type ListFilterKey } from "../hooks/useProductFilters";
import styles from "./Listing.module.css";

const GROUPS: ReadonlyArray<{ key: ListFilterKey; facet: keyof FilterFacets; title: string }> = [
  { key: "brands", facet: "brands", title: "Thương hiệu" },
  { key: "rams", facet: "rams", title: "RAM" },
  { key: "cpus", facet: "cpus", title: "Bộ xử lý" },
];

const parseNumber = (v: string | undefined) => Number((v ?? "").replace(/\D/g, ""));

export function FilterPanel({ facets }: { facets: FilterFacets }) {
  const { filters, setFilters, toggleValue, clearFilters } = useProductFilters();
  const [min, setMin] = useState<number | null>(filters.min ?? null);
  const [max, setMax] = useState<number | null>(filters.max ?? null);
  const [syncedFrom, setSyncedFrom] = useState({ min: filters.min, max: filters.max });

  // Đồng bộ lại ô giá khi URL đổi từ nơi khác (ví dụ bấm "Xóa lọc", bỏ chip).
  if (syncedFrom.min !== filters.min || syncedFrom.max !== filters.max) {
    setSyncedFrom({ min: filters.min, max: filters.max });
    setMin(filters.min ?? null);
    setMax(filters.max ?? null);
  }

  const [brandGroup, ...specGroups] = GROUPS;
  const renderGroup = (group: (typeof GROUPS)[number]) => {
    const options = facets[group.facet];
    if (!options.length) return null;
    return (
      <fieldset key={group.key} className={styles.group}>
        <legend className={styles.groupTitle}>{group.title}</legend>
        {options.map((value) => (
          <Checkbox
            key={value}
            checked={filters[group.key].includes(value)}
            onChange={() => toggleValue(group.key, value)}
            className={styles.checkbox}
          >
            {value}
          </Checkbox>
        ))}
      </fieldset>
    );
  };

  return (
    <aside className={styles.sidebar} aria-label="Bộ lọc sản phẩm">
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Bộ lọc</h2>
        <button type="button" className={styles.clear} onClick={clearFilters}>
          Xóa lọc
        </button>
      </div>

      {brandGroup ? renderGroup(brandGroup) : null}

      <form
        className={styles.group}
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ ...filters, min: min ?? undefined, max: max ?? undefined });
        }}
      >
        <fieldset className={styles.fieldsetReset}>
          <legend className={styles.groupTitle}>Khoảng giá</legend>
          <div className={styles.priceRow}>
            <InputNumber<number>
              aria-label="Giá từ"
              placeholder="Từ"
              min={0}
              step={500_000}
              controls={false}
              value={min}
              onChange={setMin}
              formatter={(v) => (v ? formatNumber(Number(v)) : "")}
              parser={parseNumber}
              className={styles.priceInput}
            />
            <InputNumber<number>
              aria-label="Giá đến"
              placeholder="Đến"
              min={0}
              step={500_000}
              controls={false}
              value={max}
              onChange={setMax}
              formatter={(v) => (v ? formatNumber(Number(v)) : "")}
              parser={parseNumber}
              className={styles.priceInput}
            />
          </div>
        </fieldset>
        <Button htmlType="submit" block icon={<SlidersIcon />} className={styles.applyButton}>
          Áp dụng
        </Button>
      </form>

      {specGroups.map(renderGroup)}
    </aside>
  );
}
