"use client";

// FDD 1.1.6 + header — hiện tên người đang đăng nhập và nút đăng xuất.
// Hỏi phiên qua /api/session sau khi trang tải để layout công khai vẫn giữ SSG/ISR (mục 10.1).
// Hỏi lại mỗi khi đổi trang: đăng nhập xong quay về từ /login thì header cập nhật ngay.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { LogoutButton } from "@/features/auth";
import styles from "./StorefrontHeader.module.css";

export type SessionResponse = { user: { full_name: string; role: "user" | "admin" } | null };

type Props = { guestLabel: string; linkClassName: string };

export function UserMenu({ guestLabel, linkClassName }: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionResponse["user"]>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/session", { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json() as Promise<SessionResponse>)
      .then((data) => setUser(data.user))
      .catch(() => {
        // Huỷ do đổi trang hoặc lỗi mạng: giữ nguyên trạng thái hiện tại
      });
    return () => controller.abort();
  }, [pathname]);

  if (!user) {
    return (
      <Link href={routes.login} className={linkClassName}>
        <UserIcon /> {guestLabel}
      </Link>
    );
  }

  return (
    // Bấm đăng xuất thì ẩn tên ngay; Server Action xoá cookie rồi chuyển về trang chủ
    <div className={styles.userMenu} onSubmit={() => setUser(null)}>
      <Link href={routes.profile} className={linkClassName} title={user.full_name}>
        <UserIcon /> <span className={styles.userName}>{user.full_name}</span>
      </Link>
      <LogoutButton className={styles.logoutButton} />
    </div>
  );
}
