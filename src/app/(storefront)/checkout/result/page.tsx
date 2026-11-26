// FDD 5.1.2 — Kết quả đặt hàng / thanh toán (Figma 03.08–03.11). Cũng là returnUrl/cancelUrl của PayOS.
// SSR (mục 5): đọc orderCode rồi HỎI BACKEND trạng thái thật — không tin ?status=PAID / ?cancel= trên URL.
// Lớp bảo vệ 2 (mục 10.3): requirePermission trước khi lấy dữ liệu; đơn của người khác → 404. Trang riêng tư → noindex.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { orderService } from "@/entities/order/service";
import { PaymentResult } from "@/features/checkout";
import { requirePermission } from "@/lib/auth/guards";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "Kết quả thanh toán",
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: Props) {
  await requirePermission("order:own");

  const raw = (await searchParams).orderCode;
  const orderCode = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!orderCode) notFound();

  const order = await orderService.getMine(orderCode);
  if (!order) notFound();

  // `?method=` chỉ là gợi ý hiển thị phương thức (backend chưa trả ở API đơn); trạng thái luôn lấy từ backend.
  const hint = (await searchParams).method;
  const method = hint === "cod" || hint === "payos" ? hint : null;

  return <PaymentResult order={{ ...order, payment_method: order.payment_method ?? method }} />;
}
