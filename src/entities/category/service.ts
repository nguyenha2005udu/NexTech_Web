import "server-only";
import { ApiError, apiFetchPublic } from "@/lib/api/http";
import type { Category, CategoryIconKey } from "./types";

// FDD 2.1 — Danh mục phía khách. Gọi `GET /api/categories[/:id]` của catalog-service (công khai, ISR 300 s).
// Backend không có `slug`: dùng `id` làm `slug` trong URL (`/categories/<id>`).

const REVALIDATE = 300;
const NAV_COUNT = 4;

interface RawCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

// Backend chỉ lưu emoji/URL ảnh nên chọn icon của web theo tên danh mục; không khớp thì dùng "device".
const ICON_BY_KEYWORD: ReadonlyArray<readonly [RegExp, CategoryIconKey]> = [
  [/laptop|máy tính xách tay/i, "laptop"],
  [/màn hình|monitor/i, "monitor"],
  [/phụ kiện|phím|chuột|tai nghe/i, "keyboard"],
  [/linh kiện|cpu|ram|vga/i, "cpu"],
  [/lưu trữ|ổ cứng|ssd|usb/i, "storage"],
  [/mạng|router|wifi/i, "network"],
  [/thông minh|smart/i, "sparkle"],
];

const toIcon = (name: string): CategoryIconKey => ICON_BY_KEYWORD.find(([re]) => re.test(name))?.[1] ?? "device";

const toCategory = (raw: RawCategory): Category => ({
  id: raw.id,
  slug: raw.id,
  name: raw.name,
  icon: toIcon(raw.name),
});

async function list(): Promise<Category[]> {
  const raw = await apiFetchPublic<RawCategory[]>("/api/categories", REVALIDATE);
  return raw
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toCategory);
}

export const categoryService = {
  list,

  /** Thanh điều hướng header: vài danh mục đầu theo thứ tự hiển thị. */
  async listNav(): Promise<Category[]> {
    return (await list()).slice(0, NAV_COUNT);
  },

  async getBySlug(slug: string): Promise<Category | null> {
    if (!slug) return null;
    try {
      return toCategory(await apiFetchPublic<RawCategory>(`/api/categories/${encodeURIComponent(slug)}`, REVALIDATE));
    } catch (err) {
      // 404: không có; 400: id sai định dạng (vd. slug cũ "laptop").
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
      throw err;
    }
  },
};
