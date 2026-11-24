// FDD 4.2 + 5.1.1 — Khung trang đặt hàng (Figma 03.04). Server Component; phần tương tác ở CheckoutView.
import type { ComponentProps } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { routes } from "@/config/routes";
import { CheckoutView } from "./CheckoutView";
import styles from "./Checkout.module.css";

export function CheckoutPage(props: ComponentProps<typeof CheckoutView>) {
  return (
    <main className={styles.page}>
      <Breadcrumbs items={[{ label: "Giỏ hàng", href: routes.cart }, { label: "Đặt hàng" }]} />
      <div className={styles.heading}>
        <h1 className={styles.title}>Đặt hàng</h1>
        <p className={styles.description}>Kiểm tra thông tin trước khi xác nhận.</p>
      </div>
      <CheckoutView {...props} />
    </main>
  );
}
