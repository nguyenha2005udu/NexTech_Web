"use client";

// FDD 2.3 — Ảnh sản phẩm + thumbnail (Figma 01.05)
import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/entities/product";
import styles from "./ProductDetail.module.css";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImage}>
        {current ? <Image src={current.src} alt={current.alt} width={554} height={327} priority className={styles.mainImg} /> : null}
      </div>
      {images.length > 1 ? (
        <div className={styles.thumbs} role="tablist" aria-label="Ảnh sản phẩm">
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={img.alt}
              className={`${styles.thumb} ${i === active ? styles.thumbActive : ""}`}
              onClick={() => setActive(i)}
            >
              <Image src={img.src} alt="" width={66} height={50} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
