// SEO (mục 11) — sitemap.xml sinh từ dữ liệu: trang chủ + danh mục (2.1) + sản phẩm (2.3).
// Chỉ gồm trang công khai được index; /search, /account, /cart... không có ở đây.
// TODO(backend): thêm lastModified khi API trả updatedAt (không tự điền ngày giả).
import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { categoryService } from "@/entities/category/service";
import { productService } from "@/entities/product/service";

// Cùng nhịp ISR với trang danh mục: sản phẩm/danh mục mới xuất hiện trong tối đa 1 giờ.
export const revalidate = 3600;

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([categoryService.list(), productService.listPopular()]);

  return [
    { url: absolute(routes.home), changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({
      url: absolute(routes.category(c.slug)),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: absolute(routes.product(p.slug)),
      changeFrequency: "daily" as const,
      priority: 0.6,
      images: [...new Set(p.images.map((i) => absolute(i.src)))],
    })),
  ];
}
