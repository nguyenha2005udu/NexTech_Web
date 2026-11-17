import { Fragment } from "react";
import Link from "next/link";
import styles from "./Breadcrumbs.module.css";

export type Crumb = { label: string; href?: string };

// Đường dẫn phân cấp dùng chung (không biết gì về nghiệp vụ).
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn" className={styles.breadcrumbs}>
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          {i > 0 ? <span aria-hidden="true"> / </span> : null}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
