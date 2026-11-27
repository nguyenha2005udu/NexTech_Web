"use client";

import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { useAssistantStore } from "../model/useAssistantStore";
import styles from "./Assistant.module.css";

// "Hội thoại mới": bỏ hội thoại theo phiên đang mở rồi về /assistant (phiên cũ vẫn nằm ở backend).
export function NewChatLink() {
  const reset = useAssistantStore((s) => s.reset);
  return (
    <Link href={routes.assistant} className={styles.newChat} onClick={reset}>
      <PlusIcon size={16} /> Hội thoại mới
    </Link>
  );
}
