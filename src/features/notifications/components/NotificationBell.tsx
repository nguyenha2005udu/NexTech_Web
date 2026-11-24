"use client";

// FDD 6.2 — Chuông thông báo ở header: badge số chưa đọc, polling 30s. Khách (401) thì chỉ là link, không polling.
import { useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { NOTIFICATION_POLL_MS, useGetNotificationsQuery } from "../api/notificationsApi";
import styles from "./Notifications.module.css";

export function NotificationBell({ className }: { className?: string }) {
  const [stopped, setStopped] = useState(false);
  const { data, error } = useGetNotificationsQuery(undefined, {
    pollingInterval: stopped ? 0 : NOTIFICATION_POLL_MS,
    refetchOnFocus: !stopped,
  });
  const isGuest = error !== undefined && "status" in error && error.status === 401;
  // Khách: ngừng polling (đổi state ngay trong lúc render, không cần effect).
  if (isGuest && !stopped) setStopped(true);
  const unread = isGuest ? 0 : (data?.unread ?? 0);

  return (
    <Link href={routes.notifications} className={className}>
      <BellIcon /> Thông báo
      {unread > 0 ? (
        <span className={styles.badge}>
          <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
          <span className="sr-only">({unread} chưa đọc)</span>
        </span>
      ) : null}
    </Link>
  );
}
