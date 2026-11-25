// Trang 404 dùng chung cho URL không khớp route và cho notFound() ở trang chi tiết (sản phẩm, đơn hàng…).
// Trước đây trả null nên người dùng chỉ thấy trang trắng.
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/AuthShell";
import { routes } from "@/config/routes";
import { AuthHeading, AuthFooter } from "@/features/auth";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <AuthShell>
      <AuthHeading
        title="Không tìm thấy trang"
        subtitle="Đường dẫn không tồn tại hoặc nội dung đã bị gỡ. Hãy quay lại trang chủ để tiếp tục mua sắm."
      />
      <AuthFooter href={routes.home} linkLabel="Về trang chủ" />
    </AuthShell>
  );
}
