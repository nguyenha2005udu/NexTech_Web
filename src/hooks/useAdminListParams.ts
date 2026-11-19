"use client";

// Đọc / ghi tham số danh sách admin trên URL (mục 7.1: URL là nguồn sự thật cho tìm, lọc, trang, modal/drawer).
// design/admin/00 §4.2. Không biết gì về nghiệp vụ: tên tham số do màn gọi tự quyết.
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ListParamValue = string | number | undefined | null;
export type ListParamPatch = Readonly<Record<string, ListParamValue>>;

/** Tham số chỉ là trạng thái giao diện — đổi chúng không đưa danh sách về trang 1. */
const UI_PARAMS: readonly string[] = ["page", "modal", "id", "view"];

export function useAdminListParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const get = useCallback((key: string): string | undefined => searchParams.get(key) ?? undefined, [searchParams]);

  const page = useMemo(() => {
    const value = Number(searchParams.get("page"));
    return Number.isInteger(value) && value > 0 ? value : 1;
  }, [searchParams]);

  /**
   * Gộp `patch` vào URL hiện tại (`undefined`/`null`/"" = xoá tham số).
   * Đổi bất kỳ bộ lọc nào (không phải page/modal/id/view) → về trang 1.
   */
  const setParams = useCallback(
    (patch: ListParamPatch) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      if (Object.keys(patch).some((key) => !UI_PARAMS.includes(key))) next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { get, page, setParams };
}
