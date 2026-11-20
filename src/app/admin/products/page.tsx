// FDD 7.2 — Quản lý sản phẩm & tồn kho (design/admin/03). SSR: danh sách theo ?q&category&brand&sort&page&size,
// Modal theo ?modal=create | ?modal=edit&id=.
import type { Metadata } from "next";
import { Card } from "antd";
import { adminCategoryService } from "@/entities/category/admin-service";
import type { AdminProductListItem } from "@/entities/product";
import { adminProductService } from "@/entities/product/admin-service";
import {
  ProductEditor,
  ProductTable,
  ProductToolbar,
  detailToBasicValues,
  emptyBasicValues,
  parseProductListParams,
  parseProductModal,
  rowToBasicValues,
  type ProductEditorProps,
  type ProductModalState,
} from "@/features/admin/products";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Quản lý sản phẩm" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type Option = { id: string; name: string };

/** Dữ liệu cho Modal. Sửa mà không tìm thấy sản phẩm → không mở Modal. */
async function loadEditor(
  modal: ProductModalState,
  rows: readonly AdminProductListItem[],
  categories: readonly Option[],
  defaultCategoryId: string | undefined,
  brands: readonly string[],
): Promise<ProductEditorProps | null> {
  if (modal.mode === "create") {
    return { mode: "create", initialValues: emptyBasicValues(defaultCategoryId), categories, brands };
  }
  const data = await adminProductService.getForEdit(modal.id, rows);
  if (!data) return null;
  if (data.partial) {
    return {
      mode: "edit",
      productId: data.product.id,
      partial: true,
      initialValues: rowToBasicValues(data.product),
      images: [],
      specs: [],
      tags: [],
      categories,
      brands,
    };
  }
  const { product } = data;
  return {
    mode: "edit",
    productId: product.id,
    partial: false,
    initialValues: detailToBasicValues(product),
    images: product.images,
    specs: product.specs,
    tags: product.tags,
    categories,
    brands,
  };
}

export default async function AdminProductsPage({ searchParams }: Props) {
  await requirePermission("product:manage");

  const sp = await searchParams;
  const query = parseProductListParams(sp);
  const modal = parseProductModal(sp);
  const [list, categoryPage, brands] = await Promise.all([
    adminProductService.list(query),
    adminCategoryService.list({ limit: 100 }),
    adminProductService.brands(),
  ]);
  const categories: Option[] = categoryPage.items.map((c) => ({
    id: c.id,
    name: c.isActive ? c.name : `${c.name} (đang ẩn)`,
  }));
  // Danh mục mặc định khi thêm: danh mục đang hiển thị đầu tiên (backend sắp theo sortOrder)
  const defaultCategoryId = categoryPage.items.find((c) => c.isActive)?.id;
  const editor = modal ? await loadEditor(modal, list.items, categories, defaultCategoryId, brands) : null;

  return (
    <>
      <ProductToolbar categories={categories} brands={brands} />
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <ProductTable items={list.items} total={list.total} page={query.page} pageSize={query.limit} sort={query.sort} />
      </Card>
      {editor && (
        <ProductEditor key={editor.mode === "edit" ? `edit-${editor.productId}` : "create"} {...editor} />
      )}
    </>
  );
}
