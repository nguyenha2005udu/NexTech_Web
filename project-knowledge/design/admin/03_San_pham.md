# 03 — Quản lý sản phẩm

| Mục | Giá trị |
|---|---|
| FDD | 7.2 — Quản lý sản phẩm & tồn kho |
| Route | `/admin/products` → `src/app/admin/products/page.tsx` |
| Ảnh | `assets/04-products-list.png` (danh sách), `assets/05-products-modal.png` (Modal "Thêm sản phẩm") |
| Quyền | `requirePermission("product:manage")` |
| Render | SSR, đọc `searchParams` |
| Feature | `src/features/admin/products/` |
| Ghi chú reviewer trên ảnh 04 | **"danh sách dài phải có thanh cuộn"** |

---

## 1. Màn danh sách

### 1.1 Wireframe

```
Header: "Quản lý sản phẩm"                                        [🏬 Về trang bán hàng] (A)
[Tìm sản phẩm...      ] [Tất cả danh mục ▾] [Tất cả thương hiệu ▾]               [+ Thêm sản phẩm]
┌──────┬───────────────────────────────┬────────────┬──────────────┬─────────────┬────────┬─────────┬───────────┬──────────┐
│ ẢNH  │ TÊN                           │ THƯƠNG HIỆU│ DANH MỤC     │ GIÁ ⇅       │ RATING⇅│ TỒN KHO │ TRẠNG THÁI│ THAO TÁC │  ← header dính (sticky)
├──────┼───────────────────────────────┼────────────┼──────────────┼─────────────┼────────┼─────────┼───────────┼──────────┤
│ [▮]  │ Laptop UltraBook Pro 14 M3    │ Apple      │ Laptop       │ 34.990.000 ₫│ ★ 4.9  │ 12      │ [Đang bán]│ Sửa Xoá  │
│ ...  ≥ 18 dòng → vùng thân bảng cuộn dọc        (cột TỒN KHO thêm theo ✅Q-P1; ⇅ sắp xếp theo ✅Q-P5)             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Toolbar

| # | Thành phần | antd | Query URL → API |
|---|---|---|---|
| T1 | "Tìm sản phẩm..." | `Input allowClear` (debounce 300ms) | `?q=` → `search` |
| T2 | "Tất cả danh mục" | `Select` — options từ `GET /api/admin/categories?limit=100` | `?category=<uuid>` → `categoryId` |
| T3 | "Tất cả thương hiệu" | `Select showSearch` — options từ `GET /api/admin/products/brands` | `?brand=` → `brand` |
| T4 | "+ Thêm sản phẩm" | `Button type="primary"` | `?modal=create` |

✅Q-P5 — Sắp xếp bằng tiêu đề cột (`sorter`, sắp phía server), ghi `?sort=`:

| Thao tác | `?sort=` |
|---|---|
| Mặc định (không bấm) | `newest` |
| GIÁ tăng / giảm | `price_asc` / `price_desc` |
| RATING (chỉ giảm dần — API chỉ có `rating_desc`) | `rating_desc` |

**Không** thêm ô lọc trạng thái (API có `isActive` nhưng giữ toolbar đúng mockup).

### 1.3 Cột bảng

| Cột | Mẫu | Hiển thị | Field API (list) |
|---|---|---|---|
| ẢNH | ô màu 26×26 | `next/image` 32×32 bo góc, `object-fit: cover`; `null` → ô xám giữ chỗ | `thumbnail` |
| TÊN | Laptop UltraBook Pro 14 M3 | Thường, 1 dòng, `ellipsis` | `name` |
| THƯƠNG HIỆU | Apple | Thường | `brand` |
| DANH MỤC | Laptop | Xám | `category` (tên, có thể `null`) |
| GIÁ | 34.990.000₫ | Đỏ, đậm, `formatVND()`; `sorter` | `price` |
| RATING | ★ 4.9 | Sao + số; `sorter` (giảm dần); chỉ xem, không sửa (✅Q-P6) | `rating` (chuỗi decimal `"4.9"` hoặc `null` → `—`) |
| **TỒN KHO** | 12 | Số; **đỏ đậm khi ≤ 5**; `0` → chữ đỏ "Hết hàng" | `stock_quantity` (✅Q-P1, mockup chưa có) |
| TRẠNG THÁI | Đang bán | `Tag` xanh lá đặc; `false` → "Ngừng bán" xám đặc | `is_active` |
| THAO TÁC | Sửa · Xoá | link xanh / đỏ, căn phải | |

Ngưỡng sắp hết hàng `LOW_STOCK_THRESHOLD = 5` khai báo ở `features/admin/products/product.rules.ts` (dùng lại cho `LowStockTable` của dashboard nếu làm sau).

### 1.4 Thanh cuộn (yêu cầu reviewer)

- `Table sticky` + `scroll={{ x: "max-content", y: "calc(100vh - 260px)" }}`: header dính, thân bảng cuộn, toolbar luôn thấy.
- Phân trang phía server `limit=20` (API tối đa 100). `pagination.showSizeChanger` 20/50/100.
- > 200 dòng/trang mới cân nhắc virtualization (mục 9.2 instruction) — với `limit ≤ 100` thì chưa cần.

### 1.5 Xoá

- ✅Q-P2: giữ nút "Xoá" như mockup. `Popconfirm` "Xoá sản phẩm “<tên>”? Ảnh của sản phẩm cũng bị xoá, không hoàn tác được." · OK "Xoá" (`danger`) · Huỷ → `deleteProduct`.
- Backend `DELETE /api/admin/products/:id` là **xoá cứng** (xoá cả ảnh Cloudinary) — đã kiểm tra code.
- Muốn tạm ngừng bán mà không mất dữ liệu: bỏ tick "Đang bán" trong modal sửa.
- Thành công: `message.success("Đã xoá sản phẩm")`, `revalidatePath(admin.products)` + trang SP storefront.

---

## 2. Modal Thêm / Sửa sản phẩm

### 2.1 Wireframe (ảnh 05 — tab "Thông tin cơ bản")

```
┌───────────────────────────────────────────────────────────┐
│ Thêm sản phẩm                                             │
│ [Thông tin cơ bản] Ảnh  Thông số  Tags                    │ ← antd Tabs, tab đang chọn gạch chân xanh
├───────────────────────────────────────────────────────────┤
│ Tên sản phẩm                                              │
│ [VD: Laptop UltraBook Pro 14                            ] │
│ Danh mục                     Thương hiệu                  │
│ [Laptop               ▾]     [Apple                  ▾]   │
│ Giá (₫)                                                   │
│ [0                                                      ] │
│ Mô tả                                                     │
│ [Mô tả sản phẩm...                                      ] │
│ [                                                       ] │ ← TextArea ~3 dòng
│ Tồn kho                                                   │ ← thêm theo ✅Q-P1, mockup chưa có
│ [0                                                      ] │
│ ☑ Đang bán                                                │
├───────────────────────────────────────────────────────────┤
│                                [Huỷ] [Thêm sản phẩm]      │
└───────────────────────────────────────────────────────────┘
```

- `Modal width≈560`. Tiêu đề: "Thêm sản phẩm" / "Sửa sản phẩm". Nút chính: "Thêm sản phẩm" / "Lưu thay đổi".
- Mockup chỉ vẽ tab **Thông tin cơ bản**; nội dung 3 tab còn lại thiết kế theo API backend (đã chốt cùng ✅Q-P3).
- Footer (Huỷ / nút chính) chỉ hiện ở tab "Thông tin cơ bản"; 3 tab còn lại ghi ngay khi thao tác, footer chỉ có nút "Đóng".

### 2.2 Tab "Thông tin cơ bản"

| Field | Nhãn | antd | Mặc định | Ràng buộc (khớp `CreateProductDto`) | Body |
|---|---|---|---|---|---|
| `name` | Tên sản phẩm | `Input` placeholder "VD: Laptop UltraBook Pro 14" | — | Bắt buộc, trim, ≤ 255 | `name` |
| `categoryId` | Danh mục | `Select` (danh mục admin) | danh mục đầu tiên (ảnh: Laptop) | UUID, tuỳ chọn ở backend | `category_id` |
| `brand` | Thương hiệu | `AutoComplete` — gợi ý từ `GET /api/admin/products/brands`, cho gõ thương hiệu mới | (ảnh: Apple) | ≤ 100 | `brand` |
| `price` | Giá (₫) | `InputNumber` có `formatter` nghìn (`formatNumber`), `min={0}` | `0` | số nguyên > 0 (backend cho ≥ 0, UI chặn 0) | `price` |
| `description` | Mô tả | `Input.TextArea rows={3}` placeholder "Mô tả sản phẩm..." | rỗng | tuỳ chọn | `description` |
| `stockQuantity` | Tồn kho | `InputNumber min={0} precision={0}` | `0` | số nguyên ≥ 0 | `stock_quantity` (✅Q-P1) |
| `isActive` | Đang bán | `Checkbox` | `true` | boolean | `is_active` |

### 2.3 Tab "Ảnh"

| Thành phần | Hành vi | API |
|---|---|---|
| `Upload listType="picture-card"` | Chọn file → upload ngay | `POST /api/admin/products/:id/images` multipart, field `file` (+ `is_primary`, `sort_order`) |
| Ô "Hoặc dán URL ảnh" + nút Thêm | Khi chưa có Cloudinary key vẫn dùng được (spec NT.CATALOG §5) | cùng endpoint, body `image_url` |
| Nút ★ "Đặt làm ảnh chính" trên ảnh | | `PUT /api/admin/products/:id/images/:image_id` `{ is_primary: true }` |
| Nút xoá ảnh | `Popconfirm` | `DELETE /api/admin/products/:id/images/:image_id` |

Lỗi: `400 NT-CAT-1010` "Vui lòng chọn file ảnh hoặc nhập URL ảnh"; Cloudinary timeout `504 NT-GEN-0504`, lỗi khác `503 NT-GEN-0503`.

### 2.4 Tab "Thông số"

Bảng sửa trực tiếp (`Form.List`): mỗi dòng `Tên thông số` (`spec_key`, ≤100) · `Giá trị` (`spec_value`, ≤500) · `Đơn vị` (`spec_unit`, ≤50, tuỳ chọn) · nút xoá. Nút "+ Thêm thông số".
API: `POST /:id/specs`, `PUT /:id/specs/:spec_id`, `DELETE /:id/specs/:spec_id`.

### 2.5 Tab "Tags"

`Select mode="tags"`: gõ Enter để thêm, bấm × để gỡ. Tag mới tự tạo ở backend.
API: `POST /:id/tags { tag }` → `{ id, tag }`; `DELETE /:id/tags/:tag_id`. Không có API liệt kê toàn bộ tag để gợi ý.

### 2.6 Luồng Thêm → Sửa (vì ảnh/thông số/tag cần `productId`)

```
Chế độ THÊM: chỉ tab "Thông tin cơ bản" bật; 3 tab còn lại disabled + Tooltip "Lưu sản phẩm trước"
  → "Thêm sản phẩm" → createProduct → nhận id
  → URL đổi sang ?modal=edit&id=<id>, message "Đã tạo sản phẩm, tiếp tục thêm ảnh"
Chế độ SỬA: cả 4 tab bật
  - Tab cơ bản: "Lưu thay đổi" → PUT /api/admin/products/:id
  - Tab Ảnh/Thông số/Tags: mỗi thao tác gọi API ngay (không đợi nút Lưu chung)
Mỗi lần ghi thành công: revalidatePath(admin.products) + revalidatePath(routes.product(slug)) (trang SP storefront ISR)
```

✅Q-P3: dùng luồng 2 bước này (không gom 1 nút lưu tất cả).

### 2.7 Lấy dữ liệu cho chế độ Sửa (✅Q-P4 — phương án tạm)

Backend **chưa có** `GET /api/admin/products/:id` (đã gửi yêu cầu BE-1, file 00 §8). Tạm thời page server làm như sau:

```
?modal=edit&id=<id>
 ├─ thử GET /api/products/:id   (API công khai — chỉ trả SP is_active=true;
 │                                kèm category, images, specs, tags, description)
 │    → đủ dữ liệu cho cả 4 tab
 └─ 404 (SP đang "Ngừng bán")
      → lấy dòng tương ứng trong list hiện tại (name, brand, price, stock_quantity, is_active)
      → Modal hiện Alert vàng: "Sản phẩm đang ngừng bán: chưa tải được mô tả, danh mục, ảnh, thông số, tag.
         Bật “Đang bán” rồi lưu để sửa đầy đủ."
      → ô Danh mục & Mô tả để trống và KHÔNG gửi lên khi lưu (PUT chỉ gửi trường đã đổi)
      → tab Ảnh / Thông số / Tags disabled
```

Khi backend có BE-1: thay `getForEdit()` trong `entities/product/admin-service.ts`, bỏ nhánh 404 — UI không đổi.

> Sửa ở chế độ tạm gửi PUT **chỉ các trường đã đổi** (`form.isFieldsTouched` / so với giá trị ban đầu) để không ghi đè `category_id`, `description` thành rỗng.

---

## 3. API backend

> Nguồn: `backend/services/catalog/src/modules/admin-product/*` (đã đọc DTO, controller, service), gateway dòng 10.

| Hành động | Endpoint | Input | Output |
|---|---|---|---|
| Danh sách | `GET /api/admin/products` | `search?`, `categoryId?`, `brand?`, `isActive?`, `sort?`, `page=1`, `limit=20` | `{ items: AdminProductListItem[], total, page, limit, totalPages }` |
| Thương hiệu | `GET /api/admin/products/brands` | | `string[]` |
| Thêm | `POST /api/admin/products` | `{ name, category_id?, brand?, price, description?, stock_quantity?=0, is_active?=true }` | sản phẩm vừa tạo (có `id`) |
| Sửa | `PUT /api/admin/products/:id` | như trên, tất cả tuỳ chọn | sản phẩm sau sửa |
| Xoá | `DELETE /api/admin/products/:id` | | xoá cứng |
| Ảnh / Thông số / Tag | xem §2.3–2.5 | | |
| Chi tiết để sửa (tạm) | `GET /api/products/:id` (công khai, chỉ SP đang bán) | | entity + `category`, `images[]`, `specs[] { id, spec_key, spec_value, spec_unit }`, `tags[] { id, name }`, `review_count` — đọc code `catalog/src/modules/product` (✅Q-P4, §2.7) |
| Chi tiết admin | `GET /api/admin/products/:id` | | **chưa có** — yêu cầu BE-1 |

`AdminProductListItem` (đúng theo code): `{ id, name, category: string|null, brand, price, rating: string|null, stock_quantity, is_active, created_at, thumbnail: string|null }`.

Lỗi: `404 NT-CAT-1005` "Không tìm thấy sản phẩm"; `400 NT-CAT-1010`; 404 ảnh/thông số/tag mang `NT-GEN-0004`.

---

## 4. Type, schema, action

```ts
// src/entities/product/admin-types.ts
export type AdminProductSort = "price_asc" | "price_desc" | "rating_desc" | "newest";

export interface AdminProductListItem {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  price: number;
  rating: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  thumbnail: string | null;
}
```

```ts
// src/features/admin/products/schemas.ts
import { z } from "zod";

export const productBasicSchema = z.object({
  name: z.string({ error: "Vui lòng nhập tên sản phẩm" }).trim().min(1, "Vui lòng nhập tên sản phẩm").max(255, "Tối đa 255 ký tự"),
  categoryId: z.uuid("Vui lòng chọn danh mục"),
  brand: z.string().trim().max(100, "Tối đa 100 ký tự").optional(),
  price: z.number({ error: "Vui lòng nhập giá" }).int("Giá là số nguyên").positive("Giá phải lớn hơn 0"),
  description: z.string().trim().optional(),
  stockQuantity: z.number().int().min(0, "Tồn kho không âm"),
  isActive: z.boolean(),
});
export type ProductBasicInput = z.infer<typeof productBasicSchema>;

export const productSpecSchema = z.object({
  key: z.string().trim().min(1, "Nhập tên thông số").max(100),
  value: z.string().trim().min(1, "Nhập giá trị").max(500),
  unit: z.string().trim().max(50).optional(),
});

export const productTagSchema = z.object({ tag: z.string().trim().min(1).max(100) });

/** Form (camelCase) → body backend (snake_case) — 1 chỗ duy nhất. */
export function toProductBody(v: ProductBasicInput) {
  return {
    name: v.name,
    category_id: v.categoryId,
    brand: v.brand,
    price: v.price,
    description: v.description,
    stock_quantity: v.stockQuantity,
    is_active: v.isActive,
  };
}
```

```ts
// src/features/admin/products/actions.ts (trích)
"use server";
// FDD 7.2 — Sản phẩm & tồn kho
export async function saveProduct(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  await requirePermission("product:manage");
  const parsed = productBasicSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const saved = await apiFetch<{ id: string }>(id ? `/api/admin/products/${id}` : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      body: toProductBody(parsed.data),
    });
    revalidatePath(routes.admin.products);
    return { ok: true, data: { id: saved.id } };
  } catch (err) {
    return failed(err);
  }
}
```

**Upload ảnh:** `apiFetch` hiện luôn `JSON.stringify(body)` → cần thêm hàm `apiFetchForm(path, formData)` trong `src/lib/api/http.ts` (giữ cùng logic cookie + lỗi, không đặt `Content-Type` để `fetch` tự ghi boundary). Server Action `uploadProductImage(formData: FormData)` kiểm `File` (`image/*`, giới hạn dung lượng [Inference] 5MB) trước khi gửi.

---

## 5. Cấu trúc file

```
src/app/admin/products/page.tsx              # XOÁ: products/new/page.tsx, products/[id]/page.tsx (✅Q-04)
src/entities/product/
├─ admin-types.ts
└─ admin-service.ts           'server-only' — list(params), brands(), getForEdit(id) (§2.7)
src/features/admin/products/
├─ components/
│  ├─ ProductToolbar.tsx       'use client'
│  ├─ ProductTable.tsx         'use client' — sticky + scroll.y
│  ├─ ProductFormModal.tsx     'use client' — Tabs + điều phối chế độ thêm/sửa
│  ├─ ProductBasicTab.tsx
│  ├─ ImageUploader.tsx        (tên theo instruction 3.2)
│  ├─ SpecEditor.tsx           (tên theo instruction 3.2)
│  └─ TagEditor.tsx
├─ product.rules.ts · product.rules.test.ts   # LOW_STOCK_THRESHOLD, stockLevel(), sortFromTable()
├─ actions.ts · schemas.ts · schemas.test.ts
└─ index.ts
```

---

## 6. Test

| File | Case |
|---|---|
| `schemas.test.ts` | tên rỗng; giá 0/âm/thập phân → lỗi; tồn kho âm → lỗi; `toProductBody` đổi đúng snake_case |
| `actions.test.ts` | role `user` bị chặn; `ApiError NT-CAT-1005` → thông báo chung; tạo xong trả `id` |
| `ProductFormModal.test.tsx` | chế độ thêm: tab Ảnh/Thông số/Tags bị khoá; chế độ sửa: mở được; nút chính đổi chữ |
| `ProductTable.test.tsx` | `thumbnail` null hiện ô giữ chỗ; `rating` null hiện `—`; `is_active=false` → "Ngừng bán"; tồn kho 5 → đỏ, 0 → "Hết hàng" |
| `product.rules.test.ts` | `stockLevel(0/5/6)` = `out/low/ok`; `sortFromTable` map cột + chiều → đúng giá trị `?sort=` |
| `admin-service.test.ts` | `getForEdit`: API công khai 404 → trả dữ liệu dòng list + cờ `partial: true` |

---

## 7. Quyết định đã chốt (2026-11-19)

| Mã | Vấn đề | Quyết định |
|---|---|---|
| Q-P1 | Tồn kho (FDD 7.2) thiếu trong mockup | ✅ Thêm cột "TỒN KHO" (đỏ khi ≤ 5, "Hết hàng" khi 0) + ô "Tồn kho" ở tab cơ bản |
| Q-P2 | "Xoá" là xoá cứng | ✅ Giữ "Xoá" + Popconfirm cảnh báo mất ảnh; ngừng bán dùng checkbox "Đang bán" |
| Q-P3 | Luồng tạo → thêm ảnh/thông số/tag | ✅ Luồng 2 bước (§2.6) |
| Q-P4 | Thiếu API chi tiết admin | ✅ Xin backend (BE-1); tạm dùng `GET /api/products/:id` + dữ liệu dòng list cho SP ngừng bán (§2.7) |
| Q-P5 | Lọc trạng thái / sắp xếp | ✅ Sắp xếp qua tiêu đề cột GIÁ, RATING; không thêm lọc trạng thái |
| Q-P6 | Rating | ✅ Chỉ xem, không sửa |
