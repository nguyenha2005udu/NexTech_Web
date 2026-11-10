"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";

/**
 * Figma dùng 2 kiểu header: trang chủ (01.01) và các trang còn lại (01.02–01.05).
 * Cả hai được render ở server, client chỉ chọn bản hiển thị theo pathname.
 */
export function HeaderSwitch({ home, inner }: { home: ReactNode; inner: ReactNode }) {
  const pathname = usePathname();
  return <>{pathname === routes.home ? home : inner}</>;
}
