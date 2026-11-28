"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SparkleIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import styles from "./AssistantLauncher.module.css";

// Nút nổi "Hỏi trợ lý AI" (Figma 01.01, 01.05). Mở /assistant — FDD 3.1.
// Ẩn khi đang ở khu trợ lý: nút trỏ về chính trang đó và đè lên khung chat.
export function AssistantLauncher() {
  const pathname = usePathname();
  if (pathname === routes.assistant || pathname.startsWith(`${routes.assistant}/`)) return null;
  return (
    <Link href={routes.assistant} className={styles.launcher} aria-label="Hỏi trợ lý AI" title="Hỏi trợ lý AI">
      <SparkleIcon />
    </Link>
  );
}
