// FDD 7.1 — Quản lý danh mục (design/admin/02). SSR: danh sách theo ?q=&status=&page=, Modal theo ?modal=&id=.
import type { Metadata } from "next";
import { Card } from "antd";
import { adminCategoryService } from "@/entities/category/admin-service";
import {
  CategoryEditor,
  CategoryTable,
  CategoryToolbar,
  SORT_ORDER_SAMPLE,
  emptyFormValues,
  nextSortOrder,
  parseCategoryListParams,
  parseCategoryModal,
  toFormValues,
  type CategoryEditorProps,
  type CategoryModalState,
} from "@/features/admin/categories";
import { ApiError } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Quản lý danh mục" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Dữ liệu cho Modal. Sửa mà không tìm thấy danh mục (404) → không mở Modal. */
async function loadEditor(modal: CategoryModalState | null): Promise<CategoryEditorProps | null> {
  if (!modal) return null;
  const industries = adminCategoryService.listIndustries();

  if (modal.mode === "create") {
    const [sample, list] = await Promise.all([adminCategoryService.list({ limit: SORT_ORDER_SAMPLE }), industries]);
    return { mode: "create", initialValues: emptyFormValues(nextSortOrder(sample.items, sample.total)), industries: list };
  }

  const category = await adminCategoryService.get(modal.id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
  if (!category) return null;
  return { mode: "edit", categoryId: category.id, initialValues: toFormValues(category), industries: await industries };
}

export default async function AdminCategoriesPage({ searchParams }: Props) {
  await requirePermission("category:manage");

  const sp = await searchParams;
  const query = parseCategoryListParams(sp);
  const modal = parseCategoryModal(sp);
  const [list, editor] = await Promise.all([adminCategoryService.list(query), loadEditor(modal)]);

  return (
    <>
      <CategoryToolbar />
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <CategoryTable items={list.items} total={list.total} page={query.page} pageSize={query.limit} />
      </Card>
      {editor && <CategoryEditor key={`${editor.mode}-${editor.categoryId ?? "new"}`} {...editor} />}
    </>
  );
}
