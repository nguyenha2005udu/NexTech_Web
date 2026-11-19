import { siteConfig } from "@/config/site";

type BreadcrumbItem = { label: string; href?: string };

/**
 * JSON-LD BreadcrumbList cho trang con (mục 11). Mục cuối (trang hiện tại) không có href
 * nên không gắn `item`, đúng hướng dẫn của Google.
 */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: new URL(item.href, siteConfig.url).toString() } : {}),
    })),
  };
}
