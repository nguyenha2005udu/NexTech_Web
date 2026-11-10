import type { ReactNode } from "react";
import styles from "./SectionHeading.module.css";

type Props = { id?: string; children: ReactNode; action?: ReactNode };

/** Tiêu đề khối có vạch cam bên trái (Figma 01.01 "Danh mục nổi bật"). */
export function SectionHeading({ id, children, action }: Props) {
  return (
    <div className={styles.row}>
      <h2 id={id} className={styles.title}>
        <span className={styles.bar} aria-hidden="true" />
        {children}
      </h2>
      {action}
    </div>
  );
}
