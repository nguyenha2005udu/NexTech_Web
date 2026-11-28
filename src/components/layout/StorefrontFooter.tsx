import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import styles from "./StorefrontFooter.module.css";

// Chỉ dẫn tới trang đã có — không để link "#" (bấm vào chỉ cuộn lên đầu trang).
const LINKS = [
  { href: routes.search, label: "Sản phẩm" },
  { href: routes.assistant, label: "Trợ lý AI" },
  { href: routes.cart, label: "Giỏ hàng" },
  { href: routes.orderLookup, label: "Tra cứu đơn hàng" },
] as const;

export function StorefrontFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <Logo height={28} />
          <nav aria-label="Liên kết cuối trang" className={styles.links}>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.bottom}>
          <p>© {siteConfig.name} · Chính hãng 100% · Giao hỏa tốc nội thành 2 giờ</p>
          <p>
            Hỗ trợ{" "}
            <a href={`tel:${siteConfig.hotline.replace(/\s/g, "")}`} className={styles.hotline}>
              {siteConfig.hotline}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
