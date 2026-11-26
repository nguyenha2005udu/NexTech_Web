// FDD 4.2 + 5.1.1 — Đặt hàng (Figma 03.04–03.07).
// SSR (mục 5): cá nhân hoá theo người dùng. Lớp bảo vệ 2 (mục 10.3): requirePermission trước khi lấy dữ liệu
// (lớp 1 là proxy.ts, lớp 3 là placeOrder). Trang riêng tư → noindex (mục 11).
import type { Metadata } from "next";
import { addressService } from "@/entities/address/service";
import { couponService } from "@/entities/coupon/service";
import { productService } from "@/entities/product/service";
import { CheckoutPage, parseBuyNowParams, toBuyNowLine } from "@/features/checkout";
import { requirePermission } from "@/lib/auth/guards";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "Đặt hàng",
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: Props) {
  await requirePermission("order:create");

  const buyNowParams = parseBuyNowParams(await searchParams);
  const [addresses, coupons, buyNowProduct] = await Promise.all([
    addressService.listMine(),
    couponService.listAvailable(),
    buyNowParams ? productService.getBySlug(buyNowParams.slug) : null,
  ]);

  return (
    <CheckoutPage
      addresses={addresses}
      coupons={coupons}
      buyNow={buyNowParams ? toBuyNowLine(buyNowProduct, buyNowParams.quantity) : null}
    />
  );
}
