# 02 — Quản lý danh mục

| Mục | Giá trị |
|---|---|
| FDD | 7.1 — Quản lý danh mục |
| Route | `/admin/categories` → `src/app/admin/categories/page.tsx` |
| Ảnh | `assets/02-categories-list.png` (danh sách), `assets/03-categories-modal.png` (Modal "Thêm danh mục") |
| Quyền | Page + mọi Server Action: `requirePermission("category:manage")` |
| Render | SSR, đọc `searchParams` |
| Feature | `src/features/admin/categories/` |

---

## 1. Màn danh sách

### 1.1 Wireframe

```
Header: "Quản lý danh mục"                                  [🏬 Về trang bán hàng] (A)
[Tìm danh mục...          ] [Tất cả trạng thái ▾]                       [+ Thêm danh mục]
┌────────┬──────────────────────────┬────────┬────────────┬─────────────┬──────────────┐
│ ICON   │ TÊN                      │ THỨ TỰ │ TRẠNG THÁI │ NGÀY TẠO    │     THAO TÁC │
├────────┼──────────────────────────┼────────┼────────────┼─────────────┼──────────────┤
│ ▮      │ Laptop                   │ 1      │ [Hiển thị] │ 12/01/2026  │   Sửa   Ẩn   │  ← mockup ghi "Xoá", đổi "Ẩn" (✅Q-C1)
│ ▮      │ Máy ảnh                  │ 7      │ [Ẩn]       │ 12/07/2026  │   Sửa        │  ← đã ẩn: chỉ còn "Sửa"
└────────┴──────────────────────────┴────────┴────────────┴─────────────┴──────────────┘
```

### 1.2 Toolbar

| # | Thành phần | antd | Hành vi | Query URL |
|---|---|---|---|---|
| T1 | Ô "Tìm danh mục..." | `Input` `allowClear` rộng ≈ 190px | Gõ → debounce 300ms → cập nhật URL, về trang 1 | `?q=` → API `search` (tìm theo tên, không phân biệt hoa thường) |
| T2 | "Tất cả trạng thái" | `Select` rộng ≈ 95px | Tuỳ chọn: Tất cả trạng thái / Hiển thị / Ẩn | `?status=active\|hidden` → API `isActive=true\|false` |
| T3 | "+ Thêm danh mục" | `Button type="primary" icon={<PlusOutlined/>}` căn phải | Mở Modal ở chế độ thêm | `?modal=create` |

### 1.3 Cột bảng

| Cột | Mẫu | Hiển thị | Field (API) | Ghi chú |
|---|---|---|---|---|
| ICON | (vạch đen dọc trong ảnh) | Chuỗi bắt đầu `http://`/`https://` → ảnh 24×24; còn lại (emoji) → hiện nguyên chữ; `null` → `—` | `icon: string \| null` | ✅Q-C3: ô nhập tự do như mockup. Ảnh từ URL bất kỳ: `next/image` + `unoptimized` [Unverified — kiểm trong `node_modules/next/dist/docs/` xem bản 16 có bắt khai báo `remotePatterns` khi `unoptimized` không] |
| TÊN | Laptop | Thường | `name` | |
| THỨ TỰ | 1 | Số | `sortOrder` | Backend sắp danh sách theo `sortOrder ASC` |
| TRẠNG THÁI | Hiển thị / Ẩn | `Tag` xanh lá đặc / xám đặc | `isActive` | |
| NGÀY TẠO | 12/01/2026 | Xám, `dd/MM/yyyy` | `createdAt` | `formatDate()` có sẵn |
| THAO TÁC | Sửa · Ẩn | Link xanh / link đỏ, căn phải; danh mục đã ẩn chỉ có "Sửa" | | ✅Q-C1 |

- Dữ liệu mẫu trong ảnh: Laptop(1), Điện thoại(2), Tablet(3), Đồng hồ thông minh(4), Tai nghe(5), Màn hình(6), Máy ảnh(7, **Ẩn**), Phụ kiện(8).
- Phân trang: mockup không vẽ (8 dòng). [Inference] `pagination` của `Table` hiện khi `total > limit` (`limit` = 20).

### 1.4 Hành động dòng

| Hành động | Hành vi |
|---|---|
| Sửa | Mở Modal chế độ sửa, `?modal=edit&id=<id>`, đổ sẵn giá trị |
| Ẩn | `Popconfirm` "Ẩn danh mục “Laptop”? Danh mục sẽ không hiện ở trang bán hàng." · OK "Ẩn" · Huỷ → `hideCategory` (`DELETE /:id` = xoá mềm). Thành công: `message.success("Đã ẩn danh mục")` |
| Hiện lại | Không có nút riêng: mở "Sửa" → tick "Hiển thị" → Lưu |
| Xoá cứng | **Không** đưa lên UI (`DELETE /:id/hard` không dùng) — ✅Q-C1 |

---

## 2. Modal Thêm / Sửa danh mục

### 2.1 Wireframe (ảnh 03)

```
┌────────────────────────────────────────────┐
│ Thêm danh mục                              │
├────────────────────────────────────────────┤
│ Tên danh mục                               │
│ [Ví dụ: Laptop                           ] │
│ Icon (emoji hoặc URL)                      │
│ [                                        ] │
│ Thứ tự hiển thị                            │
│ [1                                       ] │
│ Ngành học (không bắt buộc)                 │ ← thêm theo ✅Q-C2, mockup chưa có
│ [Chọn ngành học                        ▾] │
│ ☑ Hiển thị                                 │
├────────────────────────────────────────────┤
│                              [Huỷ] [Lưu]   │
└────────────────────────────────────────────┘
```

- antd `Modal` `width≈440` `destroyOnHidden` `centered=false` (ảnh: modal ở giữa trang hơi lệch trên). Tiêu đề: "Thêm danh mục" / "Sửa danh mục".
- Footer: `Huỷ` (default) · `Lưu` (primary, `loading` khi đang gửi).
- Form `layout="vertical"` `requiredMark={false}` (giống `LoginForm`).

### 2.2 Trường form

| Field form | Nhãn | antd | Mặc định | Ràng buộc (khớp DTO backend `CreateCategoryDto`) | Body API |
|---|---|---|---|---|---|
| `name` | Tên danh mục | `Input` placeholder "Ví dụ: Laptop" | — | Bắt buộc, trim, 1–100 ký tự | `name` |
| `icon` | Icon (emoji hoặc URL) | `Input` | rỗng | Tuỳ chọn, ≤ 500 ký tự | `icon` |
| `sortOrder` | Thứ tự hiển thị | `InputNumber` `min={0}` `precision={0}` | Thêm mới: `max(sortOrder) + 1` (✅Q-C4); sửa: giá trị hiện tại | Số nguyên ≥ 0 | `sortOrder` |
| `industryId` | Ngành học | `Select allowClear showSearch` placeholder "Chọn ngành học" | rỗng | UUID, tuỳ chọn | `industryId` (✅Q-C2) |
| `isActive` | Hiển thị | `Checkbox` | `true` | boolean | `isActive` |

**Tính `max(sortOrder) + 1`:** backend không có API trả max. Khi mở modal thêm, page gọi `GET /api/admin/categories?limit=100` (không lọc): nếu `total ≤ 100` lấy `max` trên danh sách đó (dữ liệu thật ~10 danh mục); nếu `total > 100` dùng `total + 1`. Hàm thuần `nextSortOrder(items, total)` đặt ở `features/admin/categories/category.rules.ts`.

**Ngành học:** options lấy từ `GET /api/industries` → `[{ id, name, …, categories }]` (API công khai, đã đọc code `catalog/src/modules/industry`). Bảng danh sách **không** thêm cột ngành học (giữ đúng mockup).

### 2.3 Luồng

```
Bấm "+ Thêm danh mục" / "Sửa"
 → URL ?modal=create | ?modal=edit&id=…  (page server đọc id → categoryService.getAdmin(id) → truyền initialValues)
 → Nhập → Lưu
 → zod (client, qua zodRule) → Server Action createCategory / updateCategory
     ├─ requirePermission("category:manage")
     ├─ categoryFormSchema.safeParse
     ├─ POST /api/admin/categories  |  PATCH /api/admin/categories/:id
     └─ revalidatePath(admin.categories) + revalidatePath("/") (menu danh mục storefront)
 → ok: message.success("Đã lưu danh mục"), đóng modal (router.replace bỏ ?modal)
 → lỗi field: form.setFields ; lỗi chung: message.warning
```

Đóng modal (Huỷ / X / Esc / bấm nền) → đóng ngay, không hỏi lại (áp dụng chung mọi modal admin).

---

## 3. API backend

> Nguồn: `backend/services/catalog/src/modules/admin-category/*` (đã đọc DTO/controller/service), gateway dòng 11 (`/api/admin/categories*`, mức admin).

| Hành động | Endpoint | Input | Output |
|---|---|---|---|
| Danh sách | `GET /api/admin/categories` | `search?`, `isActive?` (`true`/`false`), `industryId?`, `page=1`, `limit=20` (≤100) | `{ items: AdminCategory[], total, page, limit, totalPages }` |
| Chi tiết | `GET /api/admin/categories/:id` | | `AdminCategory` |
| Thêm | `POST /api/admin/categories` | `{ name, icon?, sortOrder?, isActive?, industryId? }` | `AdminCategory` |
| Sửa | `PATCH /api/admin/categories/:id` | như trên, tất cả tuỳ chọn | `AdminCategory` |
| Xoá mềm | `DELETE /api/admin/categories/:id` | | `{ message: "Đã ẩn danh mục thành công" }` — chỉ đặt `isActive=false` |
| Xoá cứng | `DELETE /api/admin/categories/:id/hard` | | `{ message: "Đã xoá danh mục thành công" }` — **không dùng** (✅Q-C1) |
| Ngành học | `GET /api/industries` | | `[{ id, name, …, categories: [{ id, name, … }] }]` |

Lỗi: `404` "Không tìm thấy danh mục", `404` "Không tìm thấy ngành học" (khi `industryId` sai); validate → `400 NT-GEN-0001` (`message` là mảng). Backend không định nghĩa mã lỗi riêng cho danh mục.

**Chú ý:** tên field trộn camelCase (`sortOrder`, `isActive`, `createdAt`) với snake_case (`industry_id`, `industry_name`) — giữ đúng như backend.

---

## 4. Type, schema, action

```ts
// src/entities/category/types.ts — bổ sung (Category hiện có là dữ liệu storefront, khác shape)
export interface AdminCategory {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  industry_id: string | null;
  industry_name: string | null;
}
```

```ts
// src/features/admin/categories/schemas.ts
import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string({ error: "Vui lòng nhập tên danh mục" }).trim().min(1, "Vui lòng nhập tên danh mục").max(100, "Tối đa 100 ký tự"),
  icon: z.string().trim().max(500, "Tối đa 500 ký tự").optional(),
  sortOrder: z.number({ error: "Thứ tự phải là số" }).int("Thứ tự phải là số nguyên").min(0, "Thứ tự không âm"),
  industryId: z.uuid("Ngành học không hợp lệ").optional(),
  isActive: z.boolean(),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const categoryIdSchema = z.object({ id: z.uuid("Mã danh mục không hợp lệ") });
```

```ts
// src/features/admin/categories/actions.ts
"use server";
// FDD 7.1 — Thêm / sửa / ẩn danh mục
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { apiFetch } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import { failed, invalid } from "@/lib/action-result"; // ✅Q-05 (file 00 §4.4)
import type { ActionResult } from "@/types/action";
import { categoryFormSchema, categoryIdSchema } from "./schemas";

export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult> {
  await requirePermission("category:manage");
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await apiFetch(id ? `/api/admin/categories/${id}` : "/api/admin/categories", {
      method: id ? "PATCH" : "POST", // ⚠ apiFetch hiện chỉ khai báo GET|POST|PUT|DELETE → cần thêm "PATCH"
      body: parsed.data,
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.admin.categories);
  return { ok: true };
}

export async function hideCategory(input: unknown): Promise<ActionResult> {
  await requirePermission("category:manage");
  const parsed = categoryIdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await apiFetch(`/api/admin/categories/${parsed.data.id}`, { method: "DELETE" });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.admin.categories);
  return { ok: true };
}
```

> ⚠ `src/lib/api/http.ts` có `type Method = "GET" | "POST" | "PUT" | "DELETE"` → cần thêm `"PATCH"` (endpoint sửa danh mục là PATCH).

```tsx
// src/features/admin/categories/components/CategoryFormModal.tsx (khung)
"use client";
import { Checkbox, Form, Input, InputNumber, Modal, Select } from "antd";
import { zodRule } from "@/lib/zod-rule";
import { categoryFormSchema, type CategoryFormInput } from "../schemas";

export function CategoryFormModal({ open, mode, initialValues, industries, pending, onSubmit, onClose }: {
  open: boolean;
  mode: "create" | "edit";
  /** Thêm mới: { name: "", sortOrder: nextSortOrder(...), isActive: true } — page tính sẵn */
  initialValues: CategoryFormInput;
  industries: ReadonlyArray<{ id: string; name: string }>;
  pending: boolean;
  onSubmit: (values: CategoryFormInput) => void;
  onClose: () => void;
}) {
  const [form] = Form.useForm<CategoryFormInput>();
  return (
    <Modal
      open={open}
      title={mode === "create" ? "Thêm danh mục" : "Sửa danh mục"}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={pending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false} initialValues={initialValues} onFinish={onSubmit}>
        <Form.Item name="name" label="Tên danh mục" rules={[zodRule(categoryFormSchema.shape.name)]}>
          <Input placeholder="Ví dụ: Laptop" autoFocus />
        </Form.Item>
        <Form.Item name="icon" label="Icon (emoji hoặc URL)" rules={[zodRule(categoryFormSchema.shape.icon)]}>
          <Input />
        </Form.Item>
        <Form.Item name="sortOrder" label="Thứ tự hiển thị" rules={[zodRule(categoryFormSchema.shape.sortOrder)]}>
          <InputNumber min={0} precision={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="industryId" label="Ngành học (không bắt buộc)">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn ngành học"
            options={industries.map((i) => ({ value: i.id, label: i.name }))}
          />
        </Form.Item>
        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Hiển thị</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

> `style={{ width: "100%" }}` là ví dụ rút gọn — khi code đưa vào CSS Module theo style repo.

---

## 5. Cấu trúc file

```
src/app/admin/categories/page.tsx          # FDD 7.1 — requirePermission → list + industries + (nếu ?modal=edit) getAdmin(id)
                                           # XOÁ: categories/new/page.tsx, categories/[id]/page.tsx (✅Q-04)
src/entities/category/
├─ types.ts        (+ AdminCategory, Industry)
└─ admin-service.ts  'server-only' — listAdmin(params), getAdmin(id), listIndustries()
src/features/admin/categories/
├─ components/
│  ├─ CategoryToolbar.tsx      'use client' — ô tìm + Select + nút thêm (dùng useAdminListParams)
│  ├─ CategoryTable.tsx        'use client' — antd Table + Popconfirm "Ẩn"
│  └─ CategoryFormModal.tsx    'use client'
├─ category.rules.ts · category.rules.test.ts   # nextSortOrder()
├─ actions.ts · schemas.ts · schemas.test.ts
└─ index.ts
```

---

## 6. Test

| File | Case |
|---|---|
| `schemas.test.ts` | tên rỗng / chỉ khoảng trắng → lỗi; tên 101 ký tự → lỗi; `sortOrder` âm, số thập phân → lỗi; icon rỗng hợp lệ |
| `actions.test.ts` | role `user` → redirect `/403` (mock `getSessionUser`); input sai → `fieldErrors`; `ApiError 404` → `{ ok:false, message }`; thành công gọi `revalidatePath` |
| `CategoryFormModal.test.tsx` | bấm "Lưu" khi tên trống → hiện "Vui lòng nhập tên danh mục"; chế độ sửa đổ sẵn giá trị; tiêu đề đổi theo `mode`; bỏ trống ngành học vẫn lưu được |
| `category.rules.test.ts` | `nextSortOrder([], 0)` = 1; lấy max + 1 (không phải số dòng + 1); `total > 100` → `total + 1` |
| `CategoryTable.test.tsx` | dòng "Hiển thị" có link "Ẩn"; dòng "Ẩn" không có; bấm "Ẩn" mở hộp xác nhận |

---

## 7. Quyết định đã chốt (2026-11-19)

| Mã | Vấn đề | Quyết định |
|---|---|---|
| Q-C1 | "Xoá" = xoá mềm hay xoá cứng | ✅ Xoá mềm (`DELETE /:id`). Link đổi tên **"Ẩn"**, Popconfirm ghi rõ "Ẩn"; danh mục đã ẩn không có link này; **không** đưa xoá cứng lên UI |
| Q-C2 | Ô Ngành học | ✅ Thêm `Select` "Ngành học (không bắt buộc)", dữ liệu `GET /api/industries` |
| Q-C3 | Icon | ✅ Giữ ô nhập tự do (emoji hoặc URL) như mockup; storefront map icon theo dữ liệu thật sau |
| Q-C4 | Thứ tự mặc định | ✅ `max(sortOrder) + 1` (`nextSortOrder()`) |
