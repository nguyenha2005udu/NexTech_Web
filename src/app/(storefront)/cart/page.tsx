// FDD 4.1 — Giỏ hàng (Figma 03.01–03.03).
// CSR (mục 5): giỏ của khách nằm ở client (Redux + localStorage) nên page chỉ là shell tĩnh;
// CartView đọc store sau khi nạp giỏ. Trang riêng tư → noindex (mục 11).
import type { Metadata } from "next";
import { CartPage } from "@/features/cart";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CartPage />;
}
