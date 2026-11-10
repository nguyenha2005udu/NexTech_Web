"use client";

// FDD 2.2 — Ô tìm kiếm ở header. Gửi GET tới /search?q= (next/form tự điều hướng phía client).
import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import styles from "./SearchBar.module.css";

type Props = { variant?: "hero" | "compact"; placeholder?: string };

export function SearchBar({ variant = "compact", placeholder }: Props) {
  const q = useSearchParams().get("q") ?? "";
  return <SearchBarView variant={variant} placeholder={placeholder} defaultValue={q} />;
}

/** Bản không đọc URL — dùng làm fallback của <Suspense> khi prerender. */
export function SearchBarView({
  variant = "compact",
  placeholder,
  defaultValue = "",
}: Props & { defaultValue?: string }) {
  const text =
    placeholder ?? (variant === "hero" ? "Bạn cần tìm sản phẩm gì?" : "Tìm laptop, linh kiện, phụ kiện…");

  if (variant === "hero") {
    return (
      <Form action={routes.search} className={styles.hero} role="search">
        <label htmlFor="header-search" className="sr-only">
          Tìm sản phẩm
        </label>
        <input
          id="header-search"
          key={defaultValue}
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={text}
          className={styles.heroInput}
          autoComplete="off"
        />
        <button type="submit" className={styles.heroButton} aria-label="Tìm sản phẩm">
          <SearchIcon />
        </button>
      </Form>
    );
  }

  return (
    <Form action={routes.search} className={styles.compact} role="search">
      <SearchIcon className={styles.compactIcon} />
      <label htmlFor="header-search" className="sr-only">
        Tìm sản phẩm
      </label>
      <input
        id="header-search"
        key={defaultValue}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={text}
        className={styles.compactInput}
        autoComplete="off"
      />
    </Form>
  );
}
