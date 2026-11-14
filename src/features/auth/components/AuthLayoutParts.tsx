import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheckIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import styles from "./auth.module.css";

/** Khối nội dung dưới tiêu đề (padding-top 30, gap 17) */
export function AuthBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}

/** Dòng chân có viền trên ("Chưa có tài khoản? Đăng ký ngay") */
export function AuthFooter({ text, href, linkLabel }: { text?: string; href: string; linkLabel: string }) {
  return (
    <p className={styles.footer}>
      {text ? `${text} ` : null}
      <Link href={href} className={styles.link}>
        {linkLabel}
      </Link>
    </p>
  );
}

/** Nội dung trang 403 (Figma 05.08) */
export function ForbiddenPanel() {
  return (
    <>
      <div className={styles.notice} role="status">
        <ShieldCheckIcon />
        Mã lỗi 403 · Quyền truy cập bị giới hạn
      </div>
      <Link href={routes.home} className={styles.buttonLink}>
        Về trang chủ
      </Link>
    </>
  );
}
