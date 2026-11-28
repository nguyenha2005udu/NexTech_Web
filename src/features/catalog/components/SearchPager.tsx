// FDD 2.2 — Phân trang kết quả tìm kiếm bằng link (?page=): SSR được, chia sẻ link được (mục 7.1), không cần JS.
// Link giữ nguyên từ khoá/bộ lọc/sắp xếp, chỉ đổi `page`.
import Link from "next/link";
import { routes } from "@/config/routes";
import { searchHref, type ProductFilters } from "@/entities/product";
import { pageWindow } from "@/lib/pagination";
import styles from "./Listing.module.css";

type Props = { filters: ProductFilters; page: number; totalPages: number };

export function SearchPager({ filters, page, totalPages }: Props) {
  if (totalPages <= 1) return null;
  const href = (p: number) => searchHref(routes.search, filters, p);

  return (
    <nav className={styles.pager} aria-label="Phân trang kết quả">
      {page > 1 ? (
        <Link href={href(page - 1)} className={styles.pagerLink} rel="prev">
          ← Trước
        </Link>
      ) : (
        <span className={styles.pagerDisabled}>← Trước</span>
      )}
      <ul className={styles.pagerList}>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className={styles.pagerGap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span className={styles.pagerCurrent} aria-current="page">
                  {p}
                </span>
              ) : (
                <Link href={href(p)} className={styles.pagerLink} aria-label={`Trang ${p}`}>
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={styles.pagerLink} rel="next">
          Sau →
        </Link>
      ) : (
        <span className={styles.pagerDisabled}>Sau →</span>
      )}
    </nav>
  );
}
