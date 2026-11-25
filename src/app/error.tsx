"use client";

// Lỗi không lường trước khi render một route (Server Component ném lỗi…). Trước đây trả null → trang trắng.
// `reset` thử render lại; không hiện `error.message` ra cho người dùng (có thể lộ chi tiết nội bộ).
import { useEffect } from "react";
import { Button } from "antd";
import { AuthShell } from "@/components/layout/AuthShell";
import { routes } from "@/config/routes";
import { AuthBody, AuthFooter, AuthHeading } from "@/features/auth";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AuthShell>
      <AuthHeading title="Đã có lỗi xảy ra" subtitle="Rất tiếc, trang này tạm thời không tải được. Bạn thử lại nhé." />
      <AuthBody>
        <Button type="primary" block onClick={reset}>
          Thử lại
        </Button>
      </AuthBody>
      <AuthFooter href={routes.home} linkLabel="Về trang chủ" />
    </AuthShell>
  );
}
