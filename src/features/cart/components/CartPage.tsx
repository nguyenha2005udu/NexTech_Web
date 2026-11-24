// FDD 4.1 — Khung trang giỏ hàng (Figma 03.01–03.03). Server Component: breadcrumb + tiêu đề render tĩnh,
// phần đọc giỏ (Redux + localStorage) nằm ở CartView (Client Component lá).
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { routes } from "@/config/routes";
import { CartView } from "./CartView";
import styles from "./CartPage.module.css";

export function CartPage() {
  return (
    <main className={styles.page}>
      <Breadcrumbs items={[{ label: "Trang chủ", href: routes.home }, { label: "Giỏ hàng" }]} />
      <div className={styles.heading}>
        <h1 className={styles.title}>Giỏ hàng</h1>
        <CartView />
      </div>
    </main>
  );
}
