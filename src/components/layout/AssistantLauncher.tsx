import Link from "next/link";
import { SparkleIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import styles from "./AssistantLauncher.module.css";

// Nút nổi "Hỏi trợ lý AI" (Figma 01.01, 01.05). Mở /assistant — FDD 3.1.
export function AssistantLauncher() {
  return (
    <Link href={routes.assistant} className={styles.launcher} aria-label="Hỏi trợ lý AI" title="Hỏi trợ lý AI">
      <SparkleIcon />
    </Link>
  );
}
