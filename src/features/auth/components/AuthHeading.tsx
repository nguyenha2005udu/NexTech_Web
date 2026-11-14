import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import styles from "./auth.module.css";

type Props = { title: string; subtitle: ReactNode };

/** "Về trang chủ" + tiêu đề + mô tả — phần đầu chung của mọi màn 05.x */
export function AuthHeading({ title, subtitle }: Props) {
  return (
    <>
      <Link href={routes.home} className={styles.back}>
        <ArrowLeftIcon /> Về trang chủ
      </Link>
      <div className={styles.heading}>
        <h1 className={styles.title} tabIndex={-1}>
          {title}
        </h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </>
  );
}
