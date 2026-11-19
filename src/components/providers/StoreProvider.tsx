"use client";

// Mục 7.2 — Mỗi phiên trình duyệt (và mỗi request khi SSR) một store riêng, tạo đúng 1 lần.
// Dùng useState(makeStore) (khởi tạo lười) thay cho mẫu useRef trong tài liệu: React 19 chặn đọc
// ref.current trong lúc render (luật react-hooks/refs), còn useState cho cùng kết quả.
import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { makeStore } from "@/lib/store";

export function StoreProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [store] = useState(() => makeStore());

  // RTK Query tự refetch khi quay lại tab / có mạng lại (refetchOnFocus, refetchOnReconnect).
  useEffect(() => setupListeners(store.dispatch), [store]);

  return <Provider store={store}>{children}</Provider>;
}
