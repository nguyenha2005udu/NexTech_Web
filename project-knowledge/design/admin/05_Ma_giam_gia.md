# 05 — Mã giảm giá

| Mục | Giá trị |
|---|---|
| FDD | 8.3 — Quản lý mã giảm giá |
| Route | `/admin/coupons` → `src/app/admin/coupons/page.tsx` |
| Ảnh | `assets/08-coupons-list.png`, `assets/09-coupons-modal.png` (ảnh gốc bị mờ — đã tăng tương phản để đọc chữ) |
| Quyền | `requirePermission("coupon:manage")` |
| Render | SSR, đọc `searchParams` |
| Feature | `src/features/admin/coupons/` |
| API backend | `/api/admin/discount-codes*` (tên backend là *discount code*, web gọi là *coupon* theo instruction) |

---

## 1. Màn danh sách

### 1.1 Wireframe

```
Header: "Mã giảm giá"                                              [🏬 Về trang bán hàng] (A)
[Tìm mã...          ] [Tất cả trạng thái ▾]                                       [+ Thêm mã]
┌──────────┬──────────────────────────┬──────┬──────────┬──────────┬────────────┬────────────┬────────────────────┐
│ MÃ       │ MÔ TẢ                    │ LOẠI │ GIÁ TRỊ  │ ĐÃ DÙNG  │ HSD        │ TRẠNG THÁI │           THAO TÁC │
├──────────┼──────────────────────────┼──────┼──────────┼──────────┼────────────┼────────────┼────────────────────┤
│ SALE10   │ Giảm 10% toàn bộ         │ %    │ 10%      │ 124/500  │ 31/12/2026 │ [Đang chạy]│   Sửa   Tạm dừng   │
│ GIAM50K  │ Giảm 50k đơn từ 1tr      │ ₫    │ 50.000₫  │ 88/200   │ 30/09/2026 │ [Đang chạy]│   Sửa   Tạm dừng   │
│ FREESHIP │ Miễn phí vận chuyển      │ ₫    │ 30.000₫  │ 512/1000 │ 31/08/2026 │ [Đang chạy]│   Sửa   Tạm dừng   │
│ NEW2026  │ Chào 2026 giảm 15%       │ %    │ 15%      │ 40/100   │ 01/03/2026 │ [Hết hạn]  │   Sửa              │
│ (tắt tay)│ …                        │      │          │          │            │ [Tạm dừng] │   Sửa   Kích hoạt  │
└──────────┴──────────────────────────┴──────┴──────────┴──────────┴────────────┴────────────┴────────────────────┘
  Mockup: "Sửa Xoá" ở mọi dòng, NEW2026 hiện "Tạm dừng" → đổi theo ✅Q-CP1, ✅Q-CP2
```

### 1.2 Toolbar

| # | Thành phần | URL → API |
|---|---|---|
| T1 | `Input` "Tìm mã..." (debounce 300ms) | `?q=` → `search` (backend tìm `code ILIKE`) |
| T2 | `Select` "Tất cả trạng thái" — Đang chạy / Tạm dừng (gồm cả hết hạn) | `?status=running\|paused` → `status` (khớp đúng enum backend; backend không lọc riêng được "Hết hạn") |
| T3 | `Button primary` "+ Thêm mã" | `?modal=create` |

### 1.3 Cột bảng

| Cột | Hiển thị | Field API |
|---|---|---|
| MÃ | Đậm, IN HOA | `code` |
| MÔ TẢ | Xám | `description` (`null` → `—`) |
| LOẠI | `%` hoặc `₫` | `discount_type`: `percent` → `%`, `fixed_amount` → `₫` |
| GIÁ TRỊ | Đậm: `10%` / `50.000₫` | `discount_value` |
| ĐÃ DÙNG | `124/500`; không giới hạn → `124/∞` | `used_count` / `usage_limit` |
| HSD | Xám `dd/MM/yyyy`; `null` → "Không hạn" | `valid_until` |
| TRẠNG THÁI | `Tag` đặc: "Đang chạy" xanh lá / "Tạm dừng" xám / **"Hết hạn" đỏ** / **"Chưa bắt đầu" xanh dương** | `couponDisplayStatus(coupon, now)` (§4) |
| THAO TÁC | Sửa · (Tạm dừng \| Kích hoạt) | xem §1.4 |

**`status` do backend tính** (đọc code `computeStatus`): `paused` khi `is_active = false` **hoặc** chưa tới `valid_from` **hoặc** đã quá `valid_until`; còn lại `running`.
✅Q-CP1: web tách nhãn từ `status` + `is_active` + ngày:

| Điều kiện (xét theo thứ tự) | Nhãn |
|---|---|
| `is_active = false` | Tạm dừng |
| `valid_until < now` | Hết hạn |
| `valid_from > now` | Chưa bắt đầu |
| còn lại | Đang chạy |

→ Dòng `NEW2026` (HSD 01/03/2026 đã qua) hiện "Hết hạn" thay vì "Tạm dừng" như mockup.
`now` lấy ở server lúc render (truyền xuống client qua props) để tránh lệch hydration.

Backend sắp `created_at DESC`, `limit` 20 (≤100).

### 1.4 Tạm dừng / Kích hoạt (thay cho "Xoá" — ✅Q-CP2)

| `is_active` | Link | Xác nhận | API |
|---|---|---|---|
| `true` | "Tạm dừng" (đỏ) | `Popconfirm` "Tạm dừng mã SALE10? Khách sẽ không dùng được mã này." | `DELETE /api/admin/discount-codes/:id` (backend chỉ đặt `is_active=false`, không xoá bản ghi) |
| `false` | "Kích hoạt" (xanh lá) | `Popconfirm` "Kích hoạt lại mã SALE10?" | `PUT /api/admin/discount-codes/:id` `{ is_active: true }` |

- Mã đã hết hạn mà vẫn `is_active = true` → hiện "Tạm dừng" như mã đang chạy; muốn dùng lại thì "Sửa" → đổi ngày hết hạn.
- Không có thao tác xoá hẳn (backend không hỗ trợ).
- Thành công: `message.success("Đã tạm dừng mã" | "Đã kích hoạt mã")`.

---

## 2. Modal Thêm / Sửa mã giảm giá (ảnh 09)

### 2.1 Wireframe

```
┌───────────────────────────────────────────────┐
│ Thêm mã giảm giá                              │
├───────────────────────────────────────────────┤
│ Mã                                            │
│ [VD: SALE10                                 ] │
│ Mô tả                                         │
│ [Mô tả ngắn                                 ] │
│ Áp dụng cho                                   │ ← thêm (✅Q-CP3)
│ [Đơn hàng                                 ▾] │
│ Loại giảm                Giá trị              │
│ [Phần trăm (%)     ▾]    [              % ]   │
│ Giảm tối đa (chỉ khi %)                       │ ← thêm (✅Q-CP4)
│ [                                         ₫ ] │
│ Đơn tối thiểu            Giới hạn lượt        │
│ [                  ₫ ]   [                  ] │
│ Thời gian hiệu lực                            │ ← mockup: "Hạn sử dụng" 1 ngày → đổi RangePicker (✅Q-CP4)
│ [dd/mm/yyyy  →  dd/mm/yyyy                  ] │
│ ☑ Kích hoạt                                   │
├───────────────────────────────────────────────┤
│                               [Huỷ] [Lưu]     │
└───────────────────────────────────────────────┘
```

Tiêu đề "Thêm mã giảm giá" / "Sửa mã giảm giá". Lưới 2 cột: `Row gutter={12}` + `Col span={12}`. `Modal width≈480`.

### 2.2 Trường form

| Field form | Nhãn | antd | Mặc định | Ràng buộc | Body API |
|---|---|---|---|---|---|
| `code` | Mã | `Input` placeholder "VD: SALE10", tự IN HOA khi gõ (`normalize`) | — | Bắt buộc, ≤ 50, chỉ `A-Z0-9_-` | `code` |
| `description` | Mô tả | `Input` placeholder "Mô tả ngắn" | — | ≤ 255 | `description` |
| `category` | Áp dụng cho | `Select`: "Đơn hàng" / "Phí vận chuyển" | `order` | bắt buộc | `category` (`order` \| `free_shipping`) — ✅Q-CP3 |
| `discountType` | Loại giảm | `Select`: "Phần trăm (%)" / "Số tiền (₫)" | `percent` | bắt buộc | `discount_type` (`percent` \| `fixed_amount`) |
| `discountValue` | Giá trị | `InputNumber`; hậu tố `%` hoặc `₫` theo loại | — | bắt buộc; `percent`: 1–100; `fixed_amount`: số nguyên > 0 | `discount_value` |
| `maxDiscount` | Giảm tối đa | `InputNumber` hậu tố `₫`; **chỉ hiện khi loại = %** (`Form.Item shouldUpdate`) | rỗng = không giới hạn | số nguyên > 0, tuỳ chọn | `max_discount` — ✅Q-CP4 |
| `minOrderValue` | Đơn tối thiểu | `InputNumber` định dạng nghìn, hậu tố `₫` | rỗng | ≥ 0, tuỳ chọn | `min_order_value` |
| `usageLimit` | Giới hạn lượt | `InputNumber precision={0}` | rỗng = không giới hạn | số nguyên ≥ 1; khi sửa ≥ `used_count` | `usage_limit` |
| `validRange` | Thời gian hiệu lực | `DatePicker.RangePicker format="DD/MM/YYYY" allowEmpty={[true, true]}` | rỗng | ngày kết thúc ≥ ngày bắt đầu; thêm mới không chọn ngày kết thúc trong quá khứ | `valid_from` (00:00:00 giờ VN), `valid_until` (23:59:59 giờ VN), ISO — ✅Q-CP4 |
| `isActive` | Kích hoạt | `Checkbox` | `true` | | `is_active` |

Khi đổi "Loại giảm" từ % sang ₫: xoá giá trị `maxDiscount` (không gửi lên).

**Khi sửa:** `UpdateDiscountCodeDto` **không có** `code` → ô "Mã" `disabled` ở chế độ sửa, không gửi `code` trong body.

### 2.3 Luồng

```
"+ Thêm mã" / "Sửa" → ?modal=create | ?modal=edit&id=…
 (không có GET chi tiết → page lấy dòng có id tương ứng trong list đang hiển thị để đổ form — ✅Q-CP5;
  id không có trên trang hiện tại → message "Không tìm thấy mã giảm giá" + bỏ ?modal)
 → Lưu → Server Action saveCoupon(id|null, values)
     ├─ requirePermission("coupon:manage") + couponFormSchema.safeParse
     ├─ POST /api/admin/discount-codes  |  PUT /api/admin/discount-codes/:id
     └─ revalidatePath(admin.coupons)
 → lỗi NT-PRM-1011 (409 "Mã đã tồn tại") → gắn vào ô `code`
```

---

## 3. API backend

> Nguồn: `backend/services/promotion/src/modules/admin-discount-code/*` (đã đọc DTO, controller, service), entity `discount-code.entity.ts`, gateway dòng 13.

| Hành động | Endpoint | Input | Output |
|---|---|---|---|
| Danh sách | `GET /api/admin/discount-codes` | `search?`, `category?`, `isActive?`, `status?` (`running`\|`paused`), `page=1`, `limit=20` | `{ items: AdminCoupon[], total, page, limit, totalPages }` |
| Thêm | `POST /api/admin/discount-codes` | `{ code, description?, category?='order', discount_type, discount_value, min_order_value?, max_discount?, usage_limit?, valid_from?, valid_until?, is_active? }` | mã vừa tạo |
| Sửa | `PUT /api/admin/discount-codes/:id` | như trên trừ `code`, tất cả tuỳ chọn | mã sau sửa |
| Vô hiệu hoá | `DELETE /api/admin/discount-codes/:id` | | `is_active=false` |
| Chi tiết | **không có** | | |

`AdminCoupon` (đúng theo code): `{ id, code, description, category, discount_type, discount_value, min_order_value, max_discount, usage_limit, used_count, valid_from, valid_until, is_active, status }`.

Lỗi: `404 NT-PRM-1010` "Không tìm thấy mã giảm giá"; `409 NT-PRM-1011` "Mã đã tồn tại"; validate `400 NT-GEN-0001`.

---

## 4. Type, schema, action

```ts
// src/entities/coupon/types.ts
export type CouponCategory = "order" | "free_shipping";
export type CouponDiscountType = "percent" | "fixed_amount";
export type CouponStatus = "running" | "paused";

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  category: CouponCategory;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  status: CouponStatus;
}

/** Nhãn hiển thị — tách từ status backend (✅Q-CP1) */
export type CouponDisplayStatus = "running" | "paused" | "expired" | "scheduled";

export const COUPON_STATUS_META: Record<CouponDisplayStatus, { label: string; color: string }> = {
  running: { label: "Đang chạy", color: "green" },
  paused: { label: "Tạm dừng", color: "default" },
  expired: { label: "Hết hạn", color: "red" },
  scheduled: { label: "Chưa bắt đầu", color: "blue" },
};

export function couponDisplayStatus(
  c: Pick<AdminCoupon, "is_active" | "valid_from" | "valid_until">,
  now: Date,
): CouponDisplayStatus {
  if (!c.is_active) return "paused";
  if (c.valid_until && new Date(c.valid_until) < now) return "expired";
  if (c.valid_from && new Date(c.valid_from) > now) return "scheduled";
  return "running";
}
```

```ts
// src/features/admin/coupons/schemas.ts
import { z } from "zod";

// Form gửi ngày dạng ISO (client đổi từ dayjs của RangePicker: from → 00:00:00, until → 23:59:59 giờ VN)
export const couponFormSchema = z
  .object({
    code: z.string().trim().min(1, "Vui lòng nhập mã").max(50, "Tối đa 50 ký tự")
      .regex(/^[A-Z0-9_-]+$/, "Chỉ gồm chữ in hoa, số, - và _"),
    description: z.string().trim().max(255, "Tối đa 255 ký tự").optional(),
    category: z.enum(["order", "free_shipping"]),
    discountType: z.enum(["percent", "fixed_amount"]),
    discountValue: z.number({ error: "Vui lòng nhập giá trị" }).positive("Giá trị phải lớn hơn 0"),
    maxDiscount: z.number().int().positive("Giảm tối đa phải lớn hơn 0").optional(),
    minOrderValue: z.number().int().min(0).optional(),
    usageLimit: z.number().int().min(1, "Tối thiểu 1 lượt").optional(),
    validFrom: z.iso.datetime({ offset: true }).optional(),
    validUntil: z.iso.datetime({ offset: true }).optional(),
    isActive: z.boolean(),
  })
  .refine((v) => v.discountType !== "percent" || v.discountValue <= 100, {
    path: ["discountValue"],
    message: "Phần trăm tối đa 100",
  })
  .refine((v) => v.discountType !== "fixed_amount" || Number.isInteger(v.discountValue), {
    path: ["discountValue"],
    message: "Số tiền phải là số nguyên",
  })
  .refine((v) => !v.validFrom || !v.validUntil || v.validFrom <= v.validUntil, {
    path: ["validRange"],
    message: "Ngày kết thúc phải sau ngày bắt đầu",
  });
export type CouponFormInput = z.infer<typeof couponFormSchema>;

/** Form (camelCase) → body backend (snake_case). `withCode = false` khi sửa (PUT không nhận `code`). */
export function toCouponBody(v: CouponFormInput, withCode: boolean) {
  return {
    ...(withCode && { code: v.code }),
    description: v.description,
    category: v.category,
    discount_type: v.discountType,
    discount_value: v.discountValue,
    max_discount: v.discountType === "percent" ? v.maxDiscount : undefined,
    min_order_value: v.minOrderValue,
    usage_limit: v.usageLimit,
    valid_from: v.validFrom,
    valid_until: v.validUntil,
    is_active: v.isActive,
  };
}

export const toggleCouponSchema = z.object({ id: z.uuid(), active: z.boolean() });
```

```ts
// src/features/admin/coupons/actions.ts (trích)
"use server";
// FDD 8.3 — Mã giảm giá
const FIELD_BY_CODE: Record<string, keyof CouponFormInput> = { "NT-PRM-1011": "code" };

/** Tạm dừng (DELETE = is_active false) / Kích hoạt (PUT is_active true) — ✅Q-CP2 */
export async function toggleCoupon(input: unknown): Promise<ActionResult> {
  await requirePermission("coupon:manage");
  const parsed = toggleCouponSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, active } = parsed.data;
  try {
    await apiFetch(`/api/admin/discount-codes/${id}`, active
      ? { method: "PUT", body: { is_active: true } }
      : { method: "DELETE" });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(routes.admin.coupons);
  return { ok: true };
}
```

---

## 5. Cấu trúc file

```
src/app/admin/coupons/page.tsx          # XOÁ: coupons/new/page.tsx, coupons/[id]/page.tsx (✅Q-04)
src/entities/coupon/{types,admin-service,index}.ts   # types.ts gồm couponDisplayStatus() + test cạnh file
src/features/admin/coupons/
├─ components/
│  ├─ CouponToolbar.tsx     'use client'
│  ├─ CouponTable.tsx       'use client' (tên theo instruction 3.2)
│  └─ CouponFormModal.tsx   'use client' (CouponForm trong instruction)
├─ actions.ts · schemas.ts · schemas.test.ts
└─ index.ts
```

---

## 6. Test

| File | Case |
|---|---|
| `schemas.test.ts` | mã có chữ thường/khoảng trắng → lỗi; `percent` 101 → lỗi; `fixed_amount` 0 hoặc thập phân → lỗi; `usageLimit` 0 → lỗi; ngày kết thúc trước ngày bắt đầu → lỗi ở `validRange`; `toCouponBody(v, false)` không có `code`; loại ₫ không gửi `max_discount` |
| `types.test.ts` (coupon) | `couponDisplayStatus`: tắt tay → paused (kể cả đã hết hạn); quá hạn → expired; chưa tới → scheduled; còn lại → running |
| `CouponFormModal.test.tsx` | đổi loại sang ₫ → hậu tố đổi, ô "Giảm tối đa" biến mất; chế độ sửa → ô Mã disabled |
| `actions.test.ts` | `ApiError` `NT-PRM-1011` → `fieldErrors.code = "Mã đã tồn tại"`; `toggleCoupon(active=false)` gọi DELETE, `true` gọi PUT `{ is_active: true }` |
| `CouponTable.test.tsx` | `usage_limit` null → `x/∞`; `valid_until` null → "Không hạn"; mã đang bật có "Tạm dừng", mã tắt có "Kích hoạt"; không có link "Xoá" |

---

## 7. Quyết định đã chốt (2026-11-19)

| Mã | Vấn đề | Quyết định |
|---|---|---|
| Q-CP1 | Mã hết hạn hiện "Tạm dừng" | ✅ Tách nhãn: Tạm dừng / Hết hạn (đỏ) / Chưa bắt đầu / Đang chạy (`couponDisplayStatus`) |
| Q-CP2 | "Xoá" thực chất là tắt mã | ✅ Đổi "Xoá" → "Tạm dừng"; mã đang tắt có "Kích hoạt" (PUT `is_active=true`) |
| Q-CP3 | Thiếu loại mã | ✅ Thêm `Select` "Áp dụng cho: Đơn hàng / Phí vận chuyển" (`category`) |
| Q-CP4 | Thiếu giảm tối đa, ngày bắt đầu | ✅ Thêm "Giảm tối đa" (chỉ khi %); "Hạn sử dụng" → `RangePicker` "Thời gian hiệu lực" |
| Q-CP5 | Không có API chi tiết | ✅ Form sửa lấy dữ liệu từ dòng trên list |
