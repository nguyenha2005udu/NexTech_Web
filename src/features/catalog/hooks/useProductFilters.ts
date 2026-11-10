"use client";

// FDD 2.2 — Đồng bộ bộ lọc ⇄ URL searchParams (URL là nguồn sự thật duy nhất, mục 7.1).
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseProductFilters,
  serializeProductFilters,
  type ProductFilters,
  type RawSearchParams,
} from "@/entities/product";

export type ListFilterKey = "brands" | "rams" | "cpus";

export function useProductFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo(() => {
    const raw: RawSearchParams = {};
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    return parseProductFilters(raw);
  }, [searchParams]);

  const setFilters = useCallback(
    (next: ProductFilters) => {
      const query = serializeProductFilters(next).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const toggleValue = useCallback(
    (key: ListFilterKey, value: string) => {
      const current = filters[key];
      const nextValues = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      setFilters({ ...filters, [key]: nextValues });
    },
    [filters, setFilters],
  );

  const clearFilters = useCallback(() => {
    // Giữ từ khoá và cách sắp xếp, chỉ bỏ các điều kiện lọc.
    setFilters({ q: filters.q, sort: filters.sort, brands: [], rams: [], cpus: [] });
  }, [filters.q, filters.sort, setFilters]);

  return { filters, setFilters, toggleValue, clearFilters };
}
