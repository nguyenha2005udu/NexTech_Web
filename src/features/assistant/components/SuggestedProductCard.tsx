import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import type { Product } from "@/entities/product";
import { formatVND } from "@/lib/format";
import styles from "./Assistant.module.css";

// Thẻ sản phẩm gợi ý trong câu trả lời của AI (FDD 3.2 — Figma 02.02).
export function SuggestedProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  return (
    <article className={styles.suggest}>
      <div className={styles.suggestMedia}>
        {image ? (
          <Image src={image.src} alt={image.alt} width={240} height={118} className={styles.suggestImage} />
        ) : null}
      </div>
      <div className={styles.suggestBody}>
        <h3 className={styles.suggestName}>{product.name}</h3>
        <p className={styles.suggestSpec}>{product.summary}</p>
        <p className={styles.suggestPrice}>{formatVND(product.price)}</p>
        <Link href={routes.product(product.slug)} className={styles.ghostBtn}>
          Xem sản phẩm <ArrowRightIcon size={14} />
        </Link>
      </div>
    </article>
  );
}
