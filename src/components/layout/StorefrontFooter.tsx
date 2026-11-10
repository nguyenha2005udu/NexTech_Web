import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import styles from "./StorefrontFooter.module.css";

export function StorefrontFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Logo height={28} />
        <nav aria-label="Liên kết hỗ trợ" className={styles.links}>
          <Link href="#">Hỗ trợ mua hàng</Link>
          <span aria-hidden="true">·</span>
          <Link href="#">Chính sách</Link>
          <span aria-hidden="true">·</span>
          <Link href="#">Liên hệ</Link>
        </nav>
      </div>
    </footer>
  );
}
