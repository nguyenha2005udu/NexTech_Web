// FDD 1.2.2 — Địa chỉ giao hàng. SSR: dữ liệu riêng của người dùng (mục 5).
import type { Metadata } from "next";
import { routes } from "@/config/routes";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { addressService } from "@/entities/address/service";
import { requirePermission } from "@/lib/auth/guards";
import { AddressList, addressesStyles } from "@/features/addresses";

export const metadata: Metadata = {
  title: "Địa chỉ giao hàng",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requirePermission("profile:manage");
  const addresses = await addressService.listMine();

  return (
    <main className={addressesStyles.wrap}>
      <Breadcrumbs items={[{ label: "Trang chủ", href: routes.home }, { label: "Địa chỉ giao hàng" }]} />
      <AddressList addresses={addresses} />
    </main>
  );
}
