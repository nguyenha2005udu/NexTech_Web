// SEO (mục 11) — robots.txt. Chặn khu riêng tư / giao dịch để bot không tốn crawl budget.
// /search KHÔNG chặn ở đây: trang tự gắn meta noindex, bot phải vào được mới đọc thấy
// (chặn bằng robots.txt thì URL vẫn có thể bị index mà không có nội dung).
import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const PRIVATE_PATHS = ["/account/", "/admin/", "/cart", "/checkout", "/assistant", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
    host: siteConfig.url,
  };
}
