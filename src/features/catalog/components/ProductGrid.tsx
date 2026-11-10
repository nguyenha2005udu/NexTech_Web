import type { CSSProperties } from "react";
import type { Product } from "@/entities/product";
import { ProductCard } from "./ProductCard";
import styles from "./ProductCard.module.css";

type Props = { products: Product[]; columns?: 3 | 4; priorityCount?: number };

export function ProductGrid({ products, columns = 4, priorityCount = 0 }: Props) {
  return (
    <div className={styles.grid} style={{ "--cols": columns } as CSSProperties}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
