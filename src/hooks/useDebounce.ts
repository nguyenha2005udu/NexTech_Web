"use client";

import { useEffect, useState } from "react";

/** Trả về `value` sau khi nó đứng yên `delay` ms (mục 9.2: ô tìm kiếm debounce 300ms). */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
