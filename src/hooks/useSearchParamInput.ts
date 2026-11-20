"use client";

// Ô tìm kiếm của bảng admin: giữ chữ đang gõ ở state, dừng gõ `delay` ms mới ghi lên URL (`?q=` mặc định).
// Đổi tham số lọc → useAdminListParams tự về trang 1. Mục 9.2: debounce 300ms.
import { useEffect, useState } from "react";
import { useAdminListParams } from "./useAdminListParams";
import { useDebounce } from "./useDebounce";

export function useSearchParamInput(key = "q", delay = 300) {
  const { get, setParams } = useAdminListParams();
  const urlValue = get(key) ?? "";
  const [value, setValue] = useState(urlValue);
  const debounced = useDebounce(value.trim(), delay);

  useEffect(() => {
    if (debounced !== urlValue) setParams({ [key]: debounced });
  }, [debounced, urlValue, key, setParams]);

  return [value, setValue] as const;
}
