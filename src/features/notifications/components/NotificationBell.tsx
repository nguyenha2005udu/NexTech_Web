"use client";

// FDD 6.2 — Chuông thông báo ở header: badge số chưa đọc, polling 30s, bấm mở dropdown vài thông báo mới nhất.
// Khách (401) thì chỉ là link tới trang thông báo (sẽ chuyển về /login), không polling.
import { useState } from "react";
import Link from "next/link";
import { Dropdown } from "antd";
import { BellIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { NOTIFICATION_POLL_MS, useGetNotificationsQuery } from "../api/notificationsApi";
import { NotificationPreview } from "./NotificationPreview";
import styles from "./Notifications.module.css";

/** Số thông báo hiện trong dropdown */
const PREVIEW_SIZE = 5;
const PREVIEW_QUERY = { page: 1, limit: PREVIEW_SIZE };

export function NotificationBell({ className }: { className?: string }) {
  const [stopped, setStopped] = useState(false);
  const [open, setOpen] = useState(false);
  const { data, error } = useGetNotificationsQuery(PREVIEW_QUERY, {
    pollingInterval: stopped ? 0 : NOTIFICATION_POLL_MS,
    refetchOnFocus: !stopped,
  });
  const isGuest = error !== undefined && "status" in error && error.status === 401;
  // Khách: ngừng polling (đổi state ngay trong lúc render, không cần effect).
  if (isGuest && !stopped) setStopped(true);
  const unread = isGuest ? 0 : (data?.unread ?? 0);

  const label = (
    <>
      <BellIcon /> Thông báo
      {unread > 0 ? (
        <span className={styles.badge}>
          <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
          <span className="sr-only">({unread} chưa đọc)</span>
        </span>
      ) : null}
    </>
  );

  if (isGuest) {
    return (
      <Link href={routes.notifications} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={["click"]}
      placement="bottomRight"
      popupRender={() => <NotificationPreview data={data} onNavigate={() => setOpen(false)} />}
    >
      <button type="button" className={`${styles.bellButton} ${className ?? ""}`} aria-haspopup="true" aria-expanded={open}>
        {label}
      </button>
    </Dropdown>
  );
}
