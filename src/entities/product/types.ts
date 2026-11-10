export type ProductTag = "Học tập" | "Văn phòng" | "Gaming" | "Phụ kiện";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  tag: ProductTag;
  /** Dòng tóm tắt cấu hình trên thẻ sản phẩm */
  summary: string;
  /** Dòng mô tả dài hơn ở trang chi tiết */
  headline: string;
  description?: string;
  price: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  /** Thuộc tính dùng cho bộ lọc (FDD 2.2) */
  ram?: string;
  cpu?: string;
  specs: ProductSpec[];
  images: ProductImage[];
}

export type ProductSort = "relevance" | "price-asc" | "price-desc" | "rating";

export interface ProductFilters {
  q?: string;
  brands: string[];
  rams: string[];
  cpus: string[];
  min?: number;
  max?: number;
  sort: ProductSort;
}
