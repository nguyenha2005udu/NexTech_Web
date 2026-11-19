# ADMIN — Tổng quan & Layout chung

> **Trạng thái:** ĐÃ CHỐT (2026-11-19) — toàn bộ câu hỏi Q-xx chốt theo phương án đề xuất, ghi ở mục 7 của từng file · **Phạm vi:** Khu quản trị `/admin` (FDD nhánh 7 + 8) · **Nguồn:** 11 ảnh mockup trong `assets/`, `FRONTEND_DEV_INSTRUCTION.md`, `CLAUDE.md`, code hiện có trong `src/`, API spec backend (`backend/project-knowledge/design/**/API_Spec.md`).
>
> **Quy ước nhãn trong bộ tài liệu:**
> - Không nhãn = đọc trực tiếp từ ảnh mockup hoặc từ tài liệu/code nguồn.
> - **[Inference]** = suy luận để lấp chỗ mockup không vẽ (trạng thái loading, bản "Sửa", xác nhận xoá…). Cần duyệt.
> - **[Unverified]** = chưa đối chiếu được với hợp đồng API backend.
> - **✅Q-xx** = điểm đã chốt (trước là câu hỏi). Nội dung trong bài đã sửa theo quyết định; bảng quyết định ở cuối mỗi file.

---

## 1. Danh sách màn hình & file tài liệu

| File | Màn hình | Ảnh nguồn | FDD | Route |
|---|---|---|---|---|
| `01_Tong_quan.md` | Tổng quan (Dashboard) | `assets/01-dashboard.png` | 8.1 | `/admin` |
| `02_Danh_muc.md` | Quản lý danh mục + Modal thêm/sửa | `02-categories-list.png`, `03-categories-modal.png` | 7.1 | `/admin/categories` |
| `03_San_pham.md` | Quản lý sản phẩm + Modal thêm/sửa (4 tab) | `04-products-list.png`, `05-products-modal.png` | 7.2 | `/admin/products` |
| `04_Don_hang.md` | Quản lý đơn hàng + Drawer chi tiết / cập nhật trạng thái | `06-orders-list.png`, `07-orders-drawer.png` | 8.2.1–8.2.3 | `/admin/orders` |
| `05_Ma_giam_gia.md` | Mã giảm giá + Modal thêm/sửa | `08-coupons-list.png`, `09-coupons-modal.png` | 8.3 | `/admin/coupons` |
| `06_Thanh_toan.md` | Quản lý thanh toán (giao dịch) + Drawer chi tiết + Xác nhận thu COD | `10-transactions-list.png`, `11-transactions-drawer.png` | 8.2.4–8.2.6 | `/admin/transactions` |

**Không có mockup:** `/admin/users` (FDD 8.4 — Người dùng). ✅Q-01: **có làm** — thêm mục menu "Người dùng" (cuối menu), màn dựng theo mẫu bảng chung ở mục 5; tài liệu riêng `07_Nguoi_dung.md` viết sau khi có mockup.

---

## 2. Layout chung `AdminShell` (áp dụng mọi màn)

### 2.1 Wireframe

```
┌──────────────┬──────────────────────────────────────────────────────────────────┐
│ 🛍 NEXTech    │ <Tiêu đề trang>                     [🏬 Về trang bán hàng]  (A)  │ ← Header trắng, cao ~56px
│   [Admin]    ├──────────────────────────────────────────────────────────────────┤
├──────────────┤                                                                  │
│ ▦ Tổng quan  │   Nền xám nhạt (#f0f2f5)                                          │
│ ⛬ Danh mục   │   ┌────────────────────────────────────────────────────────────┐ │
│ ▣ Sản phẩm   │   │ Toolbar: [Ô tìm] [Select lọc] [Select lọc] ...  [+ Thêm …] │ │
│ ▤ Đơn hàng   │   ├────────────────────────────────────────────────────────────┤ │
│ ◇ Mã giảm giá│   │ Bảng dữ liệu (card trắng, bo góc)                          │ │
│ ▭ Thanh toán │   └────────────────────────────────────────────────────────────┘ │
│ 👤 Người dùng │   (mục thêm theo ✅Q-01, mockup chưa có)                          │
│ (nền navy)   │                                                                  │
└──────────────┴──────────────────────────────────────────────────────────────────┘
```

### 2.2 Thành phần

| # | Thành phần | Mô tả từ mockup | antd | Ghi chú |
|---|---|---|---|---|
| L1 | Sider | Nền navy đậm (`#001529`-tương đương), rộng ≈ 150–160px, cố định cao 100% | `Layout.Sider` `theme="dark"` | [Inference] `width={200}` mặc định antd hơi rộng hơn ảnh; đề xuất `width={176}` |
| L2 | Logo | Icon túi mua sắm + chữ **NEXTech** (trắng) + badge **Admin** (nền xanh dương, chữ trắng, nhỏ) | `Logo` (có sẵn `components/ui/Logo.tsx`) + `Tag color="blue"` | Kiểm tra `Logo` có biến thể nền tối chưa |
| L3 | Menu | 6 mục trong mockup, có icon: Tổng quan · Danh mục · Sản phẩm · Đơn hàng · Mã giảm giá · Thanh toán; **+ Người dùng** (✅Q-01). Mục đang chọn: nền xanh dương đặc, chữ trắng | `Menu theme="dark" mode="inline"` | `selectedKeys` tính từ `usePathname()` (Client Component lá) |
| L4 | Header | Nền trắng, trái: **tiêu đề trang** (font ~16px, đậm). Phải: nút viền **"🏬 Về trang bán hàng"** + Avatar tròn xanh chữ **"A"** | `Layout.Header`, `Button`, `Avatar` | Tiêu đề khác với tên menu: "Quản lý danh mục", "Quản lý sản phẩm", "Quản lý đơn hàng", "Mã giảm giá", "Quản lý thanh toán", "Tổng quan" |
| L5 | Nút "Về trang bán hàng" | Link về `/` | `Button` + `Link href={routes.home}` | |
| L6 | Avatar | Chữ cái đầu tên admin (`avatar_url` có thì hiện ảnh) | `Avatar` + `Dropdown` | ✅Q-02: bấm mở `Dropdown` gồm tên (đậm) + email (xám) + "Đăng xuất" (dùng lại `LogoutButton` qua `@/features/auth`) |
| L7 | Content | Nền xám, padding ≈ 16–20px, các card trắng bo góc ≈ 8px, không đổ bóng | `Layout.Content` | |

### 2.3 Bảng tiêu đề trang

| Route | Menu key | Tiêu đề Header |
|---|---|---|
| `/admin` | `dashboard` | Tổng quan |
| `/admin/categories` | `categories` | Quản lý danh mục |
| `/admin/products` | `products` | Quản lý sản phẩm |
| `/admin/orders` | `orders` | Quản lý đơn hàng |
| `/admin/coupons` | `coupons` | Mã giảm giá |
| `/admin/transactions` | `transactions` | Quản lý thanh toán |
| `/admin/users` | `users` | Quản lý người dùng (✅Q-01) |

---

## 3. Theme admin — lệch với theme storefront

| Thuộc tính | Mockup admin | `src/config/theme.ts` hiện tại (storefront) |
|---|---|---|
| Màu chính | Xanh dương antd mặc định (≈ `#1677ff`): nút "+ Thêm…", menu active, link "Sửa"/"Xem", avatar | Cam `#c2410c` |
| Màu giá tiền | Đỏ (≈ `#f5222d`) | `#b51e2a` |
| Font | Sans-serif (giống Inter) | `Nunito Sans` / `Be Vietnam Pro` |
| `controlHeight` | ≈ 32px (ô tìm, select toolbar) | 43px |

✅Q-03: Admin dùng **theme riêng màu xanh** như mockup. `AdminShell` bọc `ConfigProvider` lồng nhau với `adminTheme` (khai báo cạnh `antdTheme` trong `src/config/theme.ts`, `inherit: true` để giữ locale `vi_VN` và các token chung). Font giữ nguyên `--font-body` của dự án (không thêm font mới). Màu giá tiền trong admin dùng token đỏ của antd (`colorError`).

```ts
// src/config/theme.ts — thêm
export const adminTheme: ThemeConfig = {
  inherit: true,
  token: {
    colorPrimary: "#1677ff",
    borderRadius: 6,
    borderRadiusLG: 8,
    controlHeight: 32,
  },
  components: {
    Layout: { siderBg: "#001529", headerBg: "#ffffff", bodyBg: "#f0f2f5", headerPadding: "0 20px" },
    Menu: { darkItemBg: "#001529", darkItemSelectedBg: "#1677ff" },
    Table: { headerBg: "#fafafa", headerColor: "#8c8c8c", cellPaddingBlock: 10 },
  },
};
```

---

## 4. Kiến trúc chung (theo `FRONTEND_DEV_INSTRUCTION.md`)

### 4.1 Render & bảo mật (mục 5, 10.3)

| Lớp | Áp dụng cho mọi màn admin |
|---|---|
| 1. Proxy | `src/proxy.ts` đã có `/admin/:path*` trong `matcher` và chặn role ≠ `admin` → `/403` (đã kiểm tra code) |
| 2. Page | **Mỗi** `page.tsx` gọi `await requirePermission("<action>")` **trước** khi lấy dữ liệu (không chỉ ở layout) |
| 3. Server Action | `'use server'` → `requirePermission()` + `schema.safeParse()` → `apiFetch()` → `revalidatePath()` → trả `ActionResult` |
| 4. Dữ liệu | Không gửi `userId` của admin lên API; backend tự đọc từ token |

- Chiến lược render: **SSR** (dùng cookie phiên → tự dynamic). `metadata.robots = { index: false, follow: false }` đặt ở `app/admin/layout.tsx`.
- Action RBAC dùng (đã có trong `src/lib/permissions.ts`):

| Màn | `requirePermission(...)` |
|---|---|
| Layout admin | `admin:access` |
| Tổng quan | `stats:read` |
| Danh mục | `category:manage` |
| Sản phẩm | `product:manage` |
| Đơn hàng | `order:manage` |
| Mã giảm giá | `coupon:manage` |
| Thanh toán (xem) | `transaction:read` |
| Xác nhận thu COD | `payment:confirm-cod` |

### 4.2 State (mục 7.1)

| Loại | Đặt ở |
|---|---|
| Danh sách bảng | Server Component fetch theo `searchParams` |
| Ô tìm, bộ lọc, trang | **URL `searchParams`** (`?q=&status=&page=`) — hook `useAdminListParams` (đề xuất, đặt ở `src/hooks/`, generic, debounce 300ms cho ô tìm) |
| Mở Modal thêm/sửa | **URL**: `?modal=create` / `?modal=edit&id=<id>` — F5 không mất, chia sẻ link được |
| Mở Drawer chi tiết | **URL**: `?view=<id>` — page server đọc `view`, fetch chi tiết, truyền vào Drawer |
| Form đang nhập | `Form.useForm()` của antd (local) |

✅Q-04: Theo mockup — **Modal/Drawer trên trang danh sách, điều khiển bằng URL**. **Xoá** các file rỗng hiện có:
`src/app/admin/{categories,products,coupons}/new/page.tsx`, `src/app/admin/{categories,products,coupons,orders,transactions}/[id]/page.tsx`.
Đây là điểm lệch có chủ đích so với cây thư mục mục 3.2 của instruction — ghi vào mô tả PR.

### 4.3 Khung thư mục chung

```
src/
├─ app/admin/
│  ├─ layout.tsx               # requirePermission('admin:access') + <AdminShell> + metadata noindex
│  ├─ loading.tsx              # Skeleton bảng
│  ├─ error.tsx                # Result + nút "Thử lại"
│  └─ <màn>/page.tsx           # chỉ 1 page/màn — KHÔNG có new/ và [id]/ (✅Q-04)
├─ components/layout/
│  ├─ AdminShell.tsx           # 'use client' — ConfigProvider(adminTheme) + Layout/Sider/Header; trang con (Server) đi qua children; nhận user qua props
│  │                           #   (Client vì cần ConfigProvider + Layout.Sider của antd — ghi nhận khi code Phần 0)
│  ├─ AdminSidebar.tsx         # 'use client' — Menu, selectedKeys từ usePathname()
│  ├─ AdminHeader.tsx          # 'use client' — tiêu đề theo route + Avatar dropdown
│  └─ AdminShell.module.css
├─ config/
│  ├─ routes.ts                # + admin: { dashboard, categories, products, orders, coupons, transactions }
│  └─ admin-nav.ts             # [{ key, label, title, href, icon }] — nguồn duy nhất cho Menu + tiêu đề Header
├─ hooks/
│  └─ useAdminListParams.ts    # đọc/ghi ?q=&status=&page= (+ debounce)
└─ components/ui/
   └─ (không thêm — dùng thẳng antd Table/Tag/Modal/Drawer)
```

### 4.4 Code mẫu khung

```ts
// src/config/routes.ts — bổ sung
admin: {
  dashboard: "/admin",
  categories: "/admin/categories",
  products: "/admin/products",
  orders: "/admin/orders",
  coupons: "/admin/coupons",
  transactions: "/admin/transactions",
  users: "/admin/users",
},
```

```tsx
// src/app/admin/layout.tsx — FDD 7, 8 — Khung khu quản trị
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await requirePermission("admin:access");
  return <AdminShell user={{ name: user.full_name, email: user.email, avatarUrl: user.avatar_url }}>{children}</AdminShell>;
}
```

```tsx
// src/components/layout/AdminSidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "antd";
import { adminNav } from "@/config/admin-nav";

export function AdminSidebar() {
  const pathname = usePathname();
  // Mục khớp dài nhất: "/admin/orders" thắng "/admin"
  const active = [...adminNav].sort((a, b) => b.href.length - a.href.length).find((i) => pathname.startsWith(i.href));
  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={active ? [active.key] : []}
      items={adminNav.map((i) => ({ key: i.key, icon: i.icon, label: <Link href={i.href}>{i.label}</Link> }))}
    />
  );
}
```

```ts
// Mẫu Server Action dùng chung cho mọi màn CRUD admin (mục 10.3)
"use server";
export async function deleteCategory(input: unknown): Promise<ActionResult> {
  await requirePermission("category:manage");
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await apiFetch(`/api/admin/categories/${parsed.data.id}`, { method: "DELETE" }); // đã đối chiếu code catalog-service
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.admin.categories);
  return { ok: true };
}
```

> ✅Q-05: tách `invalid()` / `failed()` từ `features/auth/actions.ts` ra `src/lib/action-result.ts`; `failed(err, fieldByCode?)` nhận thêm bảng mã lỗi → tên ô form. `features/auth/actions.ts` chuyển sang import từ đây (giữ nguyên hành vi, test auth hiện có phải vẫn xanh).

```ts
// src/lib/action-result.ts
import type { z } from "zod";
import { ApiError } from "@/lib/api/http";
import type { ActionFailure } from "@/types/action";

export function invalid(error: z.ZodError): ActionFailure {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, message: error.issues[0]?.message ?? "Dữ liệu không hợp lệ", fieldErrors };
}

export function failed(err: unknown, fieldByCode: Record<string, string> = {}): ActionFailure {
  if (!(err instanceof ApiError)) throw err;
  const field = err.code ? fieldByCode[err.code] : undefined;
  return { ok: false, message: err.message, ...(field && { fieldErrors: { [field]: err.message } }) };
}
```

> `lib/action-result.ts` import `lib/api/http.ts` (`server-only`) → chỉ dùng trong Server Action.

### 4.5 Hạ tầng cần sửa trước khi code các màn admin

| File | Thay đổi | Lý do |
|---|---|---|
| `src/lib/api/http.ts` | Thêm `"PATCH"` vào `type Method` | `PATCH /api/admin/categories/:id` |
| `src/lib/api/http.ts` | Thêm `apiFetchForm(path, formData)` (multipart, cùng logic cookie/lỗi) | Upload ảnh sản phẩm |
| `src/lib/format.ts` | Thêm `formatDateTime()`, `formatCompactVND()`, `formatOrderCode()` | Bảng đơn/giao dịch, dashboard |
| `src/types/api.ts` | **Chưa có file** (instruction §4.2 yêu cầu). Tạo mới `Paginated<T>` = `{ items, total, page, limit, totalPages }` đúng body backend | Phân trang antd `Table` |
| `src/lib/action-result.ts` | Tách `invalid()` / `failed(err, fieldByCode?)` từ `features/auth/actions.ts` | ✅Q-05 |
| `src/config/routes.ts`, `src/config/theme.ts`, `src/config/admin-nav.ts` | `routes.admin.*` (gồm `users`), `adminTheme`, menu 7 mục | §3, §4.4 |
| `src/app/admin/**/new/page.tsx`, `src/app/admin/**/[id]/page.tsx` | Xoá | ✅Q-04 |

### 4.6 Nguồn hợp đồng API

API spec trong `backend/project-knowledge/design/` chỉ liệt kê route admin, **không** ghi body/response (spec ghi "giữ nguyên body từ monolith"). Tên trường trong các file 01–06 được đọc trực tiếp từ code:
- `backend/services/catalog/src/modules/admin-category|admin-product/*` (danh mục, sản phẩm)
- `backend/services/promotion/src/modules/admin-discount-code/*` (mã giảm giá)
- `backend/be/src/admin/order|payment|statistics/*` (đơn hàng, giao dịch, thống kê — order-service mới chưa có code admin, thư mục rỗng)

→ Phần đơn hàng/giao dịch/thống kê có thể đổi khi order-service hoàn tất [Unverified].

---

## 5. Quy ước UI dùng chung cho bảng admin

| Hạng mục | Quy ước (từ mockup) |
|---|---|
| Toolbar | Ô tìm (`Input` rộng ≈ 180px, có placeholder) → các `Select` lọc ("Tất cả …") → nút chính `+ Thêm …` căn phải |
| Header bảng | Chữ IN HOA, xám, cỡ nhỏ; nền xám rất nhạt |
| Cột tiền | Đỏ, đậm, định dạng bằng `formatVND()` hiện có → `64.980.000 ₫` (✅Q-06: có khoảng trắng, thống nhất toàn site; khác mockup một khoảng trắng) |
| Cột ngày | Xám; danh sách tạo mới: `dd/MM/yyyy`; đơn/giao dịch: `dd/MM/yyyy HH:mm` |
| Cột thao tác | Căn phải; link chữ "Sửa" (xanh), "Xoá" (đỏ), "Xem" (xanh), "Xác nhận đã thu" (xanh lá) |
| Trạng thái | `Tag` nền đặc, chữ trắng, bo nhỏ (xem bảng màu trong từng màn) |
| Danh sách dài | **Phải có thanh cuộn** (comment của reviewer trên ảnh `04-products-list.png`): `Table` `sticky` header + `scroll={{ y: "calc(100vh - 220px)" }}` + `pagination` |

Thêm `formatDateTime()` (`dd/MM/yyyy HH:mm`, `Asia/Ho_Chi_Minh`) vào `src/lib/format.ts`.

**Mã hiển thị từ UUID (✅Q-D4, ✅Q-T1):** backend dùng UUID cho đơn hàng và giao dịch. Web hiển thị 8 ký tự đầu viết hoa, có `Tooltip` hiện UUID đầy đủ:

```ts
// src/lib/format.ts — bổ sung
const shortId = (uuid: string) => uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
/** "a1b2c3d4-…" → "#A1B2C3D4" */
export const formatOrderCode = (uuid: string) => `#${shortId(uuid)}`;
/** "a1b2c3d4-…" → "PAY-A1B2C3D4" */
export const formatPaymentCode = (uuid: string) => `PAY-${shortId(uuid)}`;
```

**Trạng thái màn chung (mockup không vẽ — áp dụng cho mọi màn):**
- Loading: `Table loading` / `Skeleton` trong `loading.tsx`.
- Rỗng: `Table locale.emptyText` = "Không có dữ liệu phù hợp".
- Lỗi tải: `error.tsx` → `Result status="error"` + nút "Thử lại" (`retry()` — Next 16 đổi tên prop `reset` → `retry`, theo `node_modules/next/dist/docs/.../error.md`).
- Thành công/thất bại thao tác: `App.useApp().message.success/warning` (giống `useAuthAction`).
- Thao tác phá huỷ / đổi trạng thái: luôn qua `Popconfirm` (OK là nút `danger` khi không hoàn tác được). Nhãn nút theo đúng việc backend làm: Danh mục "Ẩn", Sản phẩm "Xoá", Mã giảm giá "Tạm dừng"/"Kích hoạt" (xem file từng màn).

---

## 6. Test tối thiểu (mục 12)

| Đối tượng | Case |
|---|---|
| `AdminSidebar` | active đúng mục theo pathname (`/admin`, `/admin/orders`, `/admin/orders?view=1`) |
| `useAdminListParams` | ghi `?q=` sau 300ms (fake timers), reset `page` khi đổi bộ lọc |
| Server Action admin | trả lỗi/redirect khi role `user` (mock `getSessionUser`); zod từ chối input sai |

---

## 7. Quyết định đã chốt (2026-11-19)

| Mã | Vấn đề | Quyết định |
|---|---|---|
| Q-01 | Màn **Người dùng** (FDD 8.4) — mockup thiếu | ✅ Có làm. Thêm mục menu "Người dùng"; màn theo mẫu bảng chung; tài liệu `07_Nguoi_dung.md` viết khi có mockup |
| Q-02 | Bấm Avatar | ✅ `Dropdown`: tên, email, "Đăng xuất" |
| Q-03 | Theme admin | ✅ `adminTheme` màu xanh, `ConfigProvider` lồng trong `AdminShell` |
| Q-04 | Modal/Drawer hay trang riêng `new` / `[id]` | ✅ Modal/Drawer + URL `?modal=` / `?view=`; xoá các page `new/`, `[id]/` rỗng |
| Q-05 | Dùng chung `invalid()/failed()` | ✅ Tách ra `src/lib/action-result.ts` |
| Q-06 | Định dạng tiền | ✅ Dùng `formatVND()` hiện có (`64.980.000 ₫`) |

Quyết định riêng từng màn nằm ở mục cuối mỗi file.

## 8. Việc cần backend bổ sung (gửi nhóm backend)

Các quyết định ở frontend đã có phương án tạm để không bị chặn; danh sách dưới đây là phần xin backend làm để bỏ phương án tạm.

| # | Yêu cầu | Màn | Phương án tạm ở web |
|---|---|---|---|
| BE-1 | `GET /api/admin/products/:id` (trả cả SP `is_active=false`, kèm `images`, `specs`, `tags`, `category_id`, `description`) | Sản phẩm | Dùng `GET /api/products/:id` (chỉ SP đang bán); SP ngừng bán sửa bằng dữ liệu dòng list |
| BE-2 | `GET /api/admin/orders` tìm cả theo mã đơn | Đơn hàng | Placeholder "Tìm theo tên khách..." |
| BE-3 | `GET /api/admin/orders` trả thêm `user_email` | Đơn hàng | Ẩn dòng email |
| BE-4 | `GET /api/admin/orders/:id` trả `shipping_recipient_name`, `shipping_phone_number`, `shipping_full_address`, `items[].product_image` | Đơn hàng | Hiện `—` |
| BE-5 | `GET /api/admin/payments` trả thêm `created_at` | Thanh toán | Hiện `paid_at`, rỗng thì `—` |
| BE-6 *(backlog)* | % tăng trưởng cho 4 thẻ dashboard | Tổng quan | Không hiện dòng tăng trưởng |
| BE-7 *(backlog)* | Trạng thái đơn `delivered` ("Hoàn tất") | Tổng quan, Đơn hàng | `shipped` = "Đang giao" là trạng thái cuối |
