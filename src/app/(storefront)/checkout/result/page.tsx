// FDD 5.1.2 — Kết quả đặt hàng / thanh toán (Figma 03.08–03.11). Cũng là returnUrl/cancelUrl của PayOS.
// SSR (mục 5): đọc orderCode rồi HỎI BACKEND trạng thái thật — không tin ?status=PAID / ?cancel= trên URL.
// Lớp bảo vệ 2 (mục 10.3): requirePermission trước khi lấy dữ liệu; đơn của người khác → 404. Trang riêng tư → noindex.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaymentResult, loadPaymentResult } from "@/features/checkout";
import { requirePermission } from "@/lib/auth/guards";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "Kết quả thanh toán",
  robots: { index: false, follow: false },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function Page({ searchParams }: Props) {
  await requirePermission("order:own");

  // `orderCode` do PayOS gắn là mã số của PayOS, không phải id đơn — loadPaymentResult xử lý (đơn/giao dịch lấy từ cookie).
  const sp = await searchParams;
  const order = await loadPaymentResult({ orderCode: first(sp.orderCode), method: first(sp.method) });
  if (!order) notFound();

  return <PaymentResult order={order} />;
}
