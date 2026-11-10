import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CartIcon, MoonIcon, UserIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { SearchBar, SearchBarView } from "@/features/catalog";
import styles from "./StorefrontHeader.module.css";

// Header trang chủ — Figma 01.01 (topbar + thanh chính).
export function HomeHeader() {
  return (
    <header className={styles.homeHeader}>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <span>Chính hãng 100% · Giao hỏa tốc nội thành 2 giờ</span>
          <span className={styles.topbarLinks}>
            <span>
              Hỗ trợ <a href={`tel:${siteConfig.hotline.replace(/\s/g, "")}`} className={styles.hotline}>{siteConfig.hotline}</a>
            </span>
            <Link href={routes.orderLookup}>Tra cứu đơn hàng</Link>
          </span>
        </div>
      </div>
      <div className={styles.homeBar}>
        <div className={styles.homeBarInner}>
          <Logo height={35} priority />
          <Suspense fallback={<SearchBarView variant="hero" />}>
            <SearchBar variant="hero" />
          </Suspense>
          <nav className={styles.homeActions} aria-label="Tài khoản và giỏ hàng">
            <Link href={routes.search} className={styles.textLink}>
              Sản phẩm
            </Link>
            <button type="button" className={styles.iconButton} aria-label="Chế độ tối (sắp có)" title="Chế độ tối (sắp có)" disabled>
              <MoonIcon />
            </button>
            <Link href={routes.cart} className={styles.iconButton} aria-label="Giỏ hàng">
              <CartIcon />
            </Link>
            <Link href={routes.login} className={styles.accountButton}>
              <UserIcon /> Tài khoản
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
