"use client";

// FDD 1.1.6 + header — hiện người đang đăng nhập; rê chuột (hoặc bấm) mở menu tài khoản có nút đăng xuất.
// Hỏi phiên qua /api/session sau khi trang tải để layout công khai vẫn giữ SSG/ISR (mục 10.1).
// Hỏi lại mỗi khi đổi trang: đăng nhập xong quay về từ /login thì header cập nhật ngay.
import { useEffect, useId, useRef, useState, type ComponentType, type FocusEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  ChevronDownIcon,
  DashboardIcon,
  LogOutIcon,
  MapPinIcon,
  MessageIcon,
  ReceiptIcon,
  TagIcon,
  UserIcon,
} from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { LogoutButton } from "@/features/auth";
import styles from "./StorefrontHeader.module.css";

export type SessionResponse = { user: { full_name: string; role: "user" | "admin" } | null };

type Props = { guestLabel: string; linkClassName: string };

type MenuLink = { href: string; label: string; Icon: ComponentType<{ size?: number }> };

const accountLinks: readonly MenuLink[] = [
  { href: routes.profile, label: "Thông tin cá nhân", Icon: UserIcon },
  { href: routes.orderLookup, label: "Đơn hàng của tôi", Icon: ReceiptIcon },
  { href: routes.addresses, label: "Địa chỉ giao hàng", Icon: MapPinIcon },
  { href: routes.notifications, label: "Thông báo", Icon: BellIcon },
  { href: routes.priceAlerts, label: "Cảnh báo giá", Icon: TagIcon },
  { href: routes.assistantHistory, label: "Lịch sử trò chuyện AI", Icon: MessageIcon },
];

/** Chữ cái đầu của tên (từ cuối trong họ tên tiếng Việt) để làm avatar.
 *  Giống `avatarInitial` ở AdminHeader; không import từ đó để header storefront không kéo theo antd. */
function initialOf(fullName: string): string {
  const given = fullName.trim().split(/\s+/).pop() ?? "";
  return given.charAt(0).toLocaleUpperCase("vi-VN") || "?";
}

export function UserMenu({ guestLabel, linkClassName }: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionResponse["user"]>(null);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef("");
  const panelId = useId();

  // Màn hình cảm ứng không có "rời chuột": chạm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

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

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    // Tab ra khỏi menu thì đóng
    if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  }

  // Chuột: hover đã mở menu nên bấm vào tên chỉ giữ menu mở. Cảm ứng / bàn phím: bấm để bật/tắt.
  function handleTriggerClick() {
    const pointer = lastPointerRef.current;
    lastPointerRef.current = "";
    if (pointer === "mouse") setOpen(true);
    else setOpen((v) => !v);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && open) {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  const initial = initialOf(user.full_name);
  const isAdmin = user.role === "admin";

  return (
    <div
      ref={rootRef}
      className={styles.userMenu}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      // Bấm đăng xuất thì ẩn tên ngay; Server Action xoá cookie rồi chuyển về trang chủ
      onSubmit={() => setUser(null)}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${linkClassName} ${styles.userTrigger}`}
        aria-expanded={open}
        aria-controls={panelId}
        title={user.full_name}
        onPointerDown={(e) => (lastPointerRef.current = e.pointerType)}
        onClick={handleTriggerClick}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initial}
        </span>
        <span className={styles.userName}>{user.full_name}</span>
        <ChevronDownIcon className={styles.chevron} />
      </button>

      {/* Bấm một mục thì đóng menu: header nằm ở layout nên không render lại khi sang trang mới */}
      <div id={panelId} className={styles.userPanel} data-open={open} onClick={() => setOpen(false)}>
        <div className={styles.userCard}>
          <div className={styles.userCardHead}>
            <span className={`${styles.avatar} ${styles.avatarLarge}`} aria-hidden="true">
              {initial}
            </span>
            <div className={styles.userCardText}>
              <strong className={styles.userCardName}>{user.full_name}</strong>
              <span className={styles.roleBadge}>{isAdmin ? "Quản trị viên" : "Thành viên"}</span>
            </div>
          </div>

          <ul className={styles.menuList}>
            {isAdmin && (
              <li>
                <Link href={routes.admin.dashboard} className={`${styles.menuItem} ${styles.menuItemAccent}`}>
                  <DashboardIcon size={18} /> Trang quản trị
                </Link>
              </li>
            )}
            {accountLinks.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} className={styles.menuItem}>
                  <Icon size={18} /> {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className={styles.menuFooter}>
            <LogoutButton className={`${styles.menuItem} ${styles.logoutItem}`}>
              <LogOutIcon size={18} /> Đăng xuất
            </LogoutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
