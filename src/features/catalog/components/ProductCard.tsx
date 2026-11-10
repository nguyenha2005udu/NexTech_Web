import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import type { Product } from "@/entities/product";
import { formatVND } from "@/lib/format";
import { Rating } from "./Rating";
import styles from "./ProductCard.module.css";

// Thẻ sản phẩm (Figma 01.01, 01.02). Không dùng hook → render được ở cả server lẫn client.
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.images[0];
  return (
    <article className={styles.card}>
      <Link href={routes.product(product.slug)} className={styles.link}>
        <div className={styles.media}>
          {image ? (
            <Image src={image.src} alt={image.alt} width={288} height={141} className={styles.image} priority={priority} />
          ) : null}
          <span className={styles.tag}>{product.tag}</span>
        </div>
        <div className={styles.body}>
          <h3 className={styles.name}>{product.name}</h3>
          <p className={styles.summary}>{product.summary}</p>
          <div className={styles.meta}>
            <span className={styles.price}>{formatVND(product.price)}</span>
            <Rating value={product.rating} />
          </div>
        </div>
      </Link>
    </article>
  );
}
