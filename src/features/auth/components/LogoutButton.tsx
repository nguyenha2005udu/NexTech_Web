// FDD 1.1.6 — Đăng xuất bằng Server Action trong <form action> (mục 10.1).
import type { ReactNode } from "react";
import { logout } from "../actions";

export function LogoutButton({ className, children = "Đăng xuất" }: { className?: string; children?: ReactNode }) {
  return (
    <form action={logout}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
