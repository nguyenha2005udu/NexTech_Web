// FDD 2.3 — Khung chờ khi trang chi tiết chưa có sẵn (slug mới, ISR lần đầu).
import { ProductDetailSkeleton } from "@/features/catalog";

export default function Loading() {
  return <ProductDetailSkeleton />;
}
