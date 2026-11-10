"use client";

// FDD 2.3 — Tab Thông số / Mô tả / Đánh giá (Figma 01.05)
import type { ReactNode } from "react";
import { Tabs } from "antd";
import type { ProductSpec } from "@/entities/product";
import styles from "./ProductDetail.module.css";

type Props = {
  specs: ProductSpec[];
  description?: string;
  reviewCount: number;
  /** Tóm tắt đánh giá hiện cạnh bảng thông số — do page ghép từ feature reviews */
  reviews: ReactNode;
};

export function ProductDetailTabs({ specs, description, reviewCount, reviews }: Props) {
  const specTable = (
    <dl className={styles.specs}>
      {specs.map((s) => (
        <div key={s.label} className={styles.specRow}>
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <section className={styles.tabsCard} aria-label="Thông tin chi tiết">
      <Tabs
        defaultActiveKey="specs"
        items={[
          {
            key: "specs",
            label: "Thông số kỹ thuật",
            children: (
              <div className={styles.tabColumns}>
                {specTable}
                <div>{reviews}</div>
              </div>
            ),
          },
          {
            key: "description",
            label: "Mô tả",
            children: <p className={styles.description}>{description ?? "Nội dung mô tả đang được cập nhật."}</p>,
          },
          { key: "reviews", label: `Đánh giá (${reviewCount})`, children: reviews },
        ]}
      />
    </section>
  );
}
