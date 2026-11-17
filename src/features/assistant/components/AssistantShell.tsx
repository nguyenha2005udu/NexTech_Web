import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/features/catalog";
import styles from "./Assistant.module.css";

// Khung trang trợ lý AI: breadcrumb + sidebar + nội dung (Figma 02.01–02.05).
export function AssistantShell({
  crumbs,
  sidebar,
  children,
}: {
  crumbs: Crumb[];
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <Breadcrumbs items={crumbs} />
      <div className={styles.layout}>
        {sidebar}
        {children}
      </div>
    </main>
  );
}
