// FDD 6.1.2–6.1.3 — Cảnh báo giá của tôi. SSR: dữ liệu riêng của người dùng (mục 5); noindex.
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { routes } from "@/config/routes";
import { priceAlertService } from "@/entities/price-alert/service";
import { productService } from "@/entities/product/service";
import { PriceAlertList, priceAlertsStyles } from "@/features/price-alerts";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Cảnh báo giá",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requirePermission("price-alert:manage");
  const alerts = await priceAlertService.listMine();
  const products = await productService.getManyByIds(alerts.map((a) => a.product_id));

  return (
    <main className={priceAlertsStyles.wrap}>
      <Breadcrumbs items={[{ label: "Trang chủ", href: routes.home }, { label: "Cảnh báo giá" }]} />
      <div>
        <h1 className={priceAlertsStyles.title}>Cảnh báo giá</h1>
        <p className={priceAlertsStyles.subtitle}>Chúng tôi sẽ thông báo khi sản phẩm bạn theo dõi giảm tới mức mong muốn.</p>
      </div>
      <PriceAlertList alerts={alerts} products={products} />
    </main>
  );
}
