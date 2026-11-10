import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { BellIcon, GridIcon, ShoppingBagIcon, SparkleIcon, UserIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { categoryService } from "@/entities/category/service";
import { SearchBar, SearchBarView } from "@/features/catalog";
import styles from "./StorefrontHeader.module.css";

// Header các trang trong — Figma 01.02–01.05 (thanh chính + điều hướng danh mục).
export async function MainHeader() {
  const navCategories = await categoryService.listNav();

  return (
    <header className={styles.mainHeader}>
      <div className={styles.mainInner}>
        <div className={styles.mainRow}>
          <Logo height={34} />
          <Suspense fallback={<SearchBarView />}>
            <SearchBar />
          </Suspense>
          <nav className={styles.mainActions} aria-label="Tài khoản và giỏ hàng">
            <Link href={routes.notifications} className={styles.navItem}>
              <BellIcon /> Thông báo
            </Link>
            <Link href={routes.cart} className={styles.navItem}>
              <ShoppingBagIcon /> Giỏ hàng
            </Link>
            <Link href={routes.login} className={styles.navItem}>
              <UserIcon /> Đăng nhập
            </Link>
          </nav>
        </div>
        <nav className={styles.categoryNav} aria-label="Danh mục sản phẩm">
          <Link href={`${routes.home}#danh-muc`} className={styles.navItem}>
            <GridIcon /> Danh mục
          </Link>
          {navCategories.map((c) => (
            <Link key={c.id} href={routes.category(c.slug)} className={styles.navLink}>
              {c.name}
            </Link>
          ))}
          <Link href={routes.assistant} className={`${styles.navItem} ${styles.assistantLink}`}>
            <SparkleIcon /> Trợ lý AI
          </Link>
        </nav>
      </div>
    </header>
  );
}
