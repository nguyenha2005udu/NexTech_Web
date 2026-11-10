"use client";

// FDD 2.2 — Chip bộ lọc đang áp dụng + sắp xếp (Figma 01.02–01.04)
import { Select } from "antd";
import { CloseIcon, SlidersIcon } from "@/components/ui/icons";
import { SORT_OPTIONS, type ProductFilters, type ProductSort } from "@/entities/product";
import { useProductFilters, type ListFilterKey } from "../hooks/useProductFilters";
import styles from "./Listing.module.css";

const LABEL_PREFIX: Record<ListFilterKey, string> = { brands: "", rams: "RAM ", cpus: "" };

function priceLabel({ min, max }: Pick<ProductFilters, "min" | "max">): string | null {
  const toM = (v: number) => `${Math.round((v / 1_000_000) * 10) / 10}`.replace(".", ",");
  if (min !== undefined && max !== undefined) return `${toM(min)}–${toM(max)} triệu`;
  if (min !== undefined) return `Từ ${toM(min)} triệu`;
  if (max !== undefined) return `Đến ${toM(max)} triệu`;
  return null;
}

export function ListingToolbar() {
  const { filters, setFilters, toggleValue } = useProductFilters();
  const price = priceLabel(filters);
  const listKeys: ListFilterKey[] = ["brands", "rams", "cpus"];

  return (
    <div className={styles.toolbar}>
      <ul className={styles.chips} aria-label="Bộ lọc đang áp dụng">
        {listKeys.flatMap((key) =>
          filters[key].map((value) => (
            <li key={`${key}-${value}`}>
              <button
                type="button"
                className={`${styles.chip} ${styles.chipAccent}`}
                onClick={() => toggleValue(key, value)}
                aria-label={`Bỏ lọc ${LABEL_PREFIX[key]}${value}`}
              >
                {LABEL_PREFIX[key]}
                {value}
                <CloseIcon size={14} />
              </button>
            </li>
          )),
        )}
        {price ? (
          <li>
            <button
              type="button"
              className={styles.chip}
              onClick={() => setFilters({ ...filters, min: undefined, max: undefined })}
              aria-label={`Bỏ lọc giá ${price}`}
            >
              {price}
              <CloseIcon size={14} />
            </button>
          </li>
        ) : null}
      </ul>
      <Select<ProductSort>
        aria-label="Sắp xếp"
        value={filters.sort}
        onChange={(sort) => setFilters({ ...filters, sort })}
        options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        labelRender={({ label }) => <span className={styles.sortLabel}>Sắp xếp: {label}</span>}
        prefix={<SlidersIcon />}
        popupMatchSelectWidth={false}
        className={styles.sort}
      />
    </div>
  );
}
