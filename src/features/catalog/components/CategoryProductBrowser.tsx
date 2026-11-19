"use client";

// FDD 2.1 — Lọc/sắp xếp sản phẩm của danh mục ở client để trang vẫn là SSG + ISR.
import { useMemo } from "react";
import { applyProductFilters, type Product } from "@/entities/product";
import { useProductFilters } from "../hooks/useProductFilters";
import { EmptyResult } from "./EmptyResult";
import { ResultCount } from "./ResultCount";
import { ProductGrid } from "./ProductGrid";

export function CategoryProductBrowser({ products }: { products: Product[] }) {
  const { filters } = useProductFilters();
  const visible = useMemo(() => applyProductFilters(products, filters), [products, filters]);

  if (!products.length) {
    return <EmptyResult title="Danh mục đang cập nhật" text="Sản phẩm của danh mục này sẽ sớm có mặt tại NexTech." />;
  }
  if (!visible.length) return <EmptyResult />;
  return (
    <>
      <ProductGrid products={visible} columns={3} />
      <ResultCount shown={visible.length} total={products.length} />
    </>
  );
}
