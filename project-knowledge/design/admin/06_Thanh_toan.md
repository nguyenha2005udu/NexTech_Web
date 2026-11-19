# 06 — Quản lý thanh toán (giao dịch)

| Mục | Giá trị |
|---|---|
| FDD | 8.2.4 DS giao dịch · 8.2.5 Chi tiết giao dịch · 8.2.6 Xác nhận đã thu COD |
| Route | `/admin/transactions` (Drawer: `?view=<paymentId>`) — menu ghi "Thanh toán" |
| Ảnh | `assets/10-transactions-list.png`, `assets/11-transactions-drawer.png` |
| Quyền | Page: `requirePermission("transaction:read")` · Action xác nhận COD: `requirePermission("payment:confirm-cod")` |
| Render | SSR, đọc `searchParams` |
| Feature | `src/features/admin/transactions/` |
| API backend | `/api/admin/payments*` |

---

## 1. Màn danh sách

### 1.1 Wireframe

```
Header: "Quản lý thanh toán"                                          [🏬 Về trang bán hàng] (A)
[Tất cả phương thức ▾] [Tất cả trạng thái ▾]                         (không ô tìm, không nút thêm)
┌──────────┬──────────────┬────────────┬──────────────┬──────────────────┬──────────────────┬──────────────────────────┐
│ MÃ GD    │ ĐƠN LIÊN KẾT │ PHƯƠNG THỨC│ SỐ TIỀN      │ TRẠNG THÁI       │ NGÀY             │                 THAO TÁC │
├──────────┼──────────────┼────────────┼──────────────┼──────────────────┼──────────────────┼──────────────────────────┤
│ PAY-0001 │ #A1B2C3D4    │ [PayOS]    │ 64.980.000₫  │ [Thành công]     │ 24/07/2026 10:26 │                      Xem │
│ PAY-0002 │ #E5F6G7H8    │ [COD]      │ 7.990.000₫   │ [Chờ thanh toán] │ —                │  Xác nhận đã thu     Xem │
│ PAY-0004 │ #M3N4O5P6    │ [COD]      │ 2.490.000₫   │ [Đã huỷ]         │ —                │                      Xem │
│ PAY-0006 │ #U1V2W3X4    │ [PayOS]    │ 16.990.000₫  │ [Đã hoàn tiền]   │ 21/07/2026 08:20 │                      Xem │
└──────────┴──────────────┴────────────┴──────────────┴──────────────────┴──────────────────┴──────────────────────────┘
  MÃ GD thực tế dạng PAY-A1B2C3D4 (✅Q-T1); NGÀY = paid_at, chưa thu thì "—" (✅Q-T2)
```

### 1.2 Toolbar

| # | Thành phần | Options | URL → API |
|---|---|---|---|
| T1 | `Select` "Tất cả phương thức" | PayOS / COD | `?method=payos\|cod` → `method` |
| T2 | `Select` "Tất cả trạng thái" | theo `PAYMENT_STATUS_META` | `?status=` → `status` (`pending\|success\|failed\|refunded`) |

### 1.3 Cột bảng

| Cột | Hiển thị | Field API (list) |
|---|---|---|
| MÃ GD | Đậm, `PAY-A1B2C3D4`, `Tooltip` UUID | `id` (UUID) → `formatPaymentCode()` (✅Q-T1; mockup `PAY-0001`) |
| ĐƠN LIÊN KẾT | `#A1B2C3D4` — link xanh | `order_id` → `formatOrderCode()`; `Link` cùng tab tới `/admin/orders?view=<order_id>` (✅Q-T3) |
| PHƯƠNG THỨC | `Tag` PayOS (xanh dương đặc) / COD (xanh lá đặc) | `method` |
| SỐ TIỀN | Đỏ, đậm | `amount` |
| TRẠNG THÁI | `Tag` (bảng §4) | `status` |
| NGÀY | Xám `dd/MM/yyyy HH:mm`; `null` → `—` | `created_at` khi backend có (BE-5), hiện tại dùng `paid_at` (null với giao dịch chưa thu) — ✅Q-T2 |
| THAO TÁC | "Xác nhận đã thu" (xanh lá, chỉ khi `method=cod` **và** `status=pending`) · "Xem" (xanh) | |

Lưu ý dữ liệu mẫu trong ảnh: PAY-0003 (41.500.000₫) và PAY-0005 (34.980.000₫) lệch tổng tiền của đơn cùng mã ở ảnh 06 (47.280.000₫, 34.480.000₫) — chỉ là số liệu mockup, không ảnh hưởng thiết kế.

---

## 2. Xác nhận đã thu COD (8.2.6)

Mockup chỉ vẽ link; hộp xác nhận thiết kế thêm (bắt buộc vì thao tác không hoàn tác được). Đây là **nơi duy nhất** có nút này (✅Q-O5):

```
Bấm "Xác nhận đã thu"
 → Modal.confirm (App.useApp().modal):
     Tiêu đề: "Xác nhận đã thu tiền?"
     Nội dung: "Giao dịch PAY-A1B2C3D4 · Đơn #E5F6G7H8 · 7.990.000 ₫. Thao tác này đổi giao dịch sang Thành công."
     OK "Đã thu tiền" (primary) · Huỷ
 → Server Action confirmCodPayment({ id })
     ├─ requirePermission("payment:confirm-cod") + zod
     ├─ POST /api/admin/payments/:id/confirm-cod   (backend đổi giao dịch + đơn trong một transaction)
     └─ revalidatePath(admin.transactions) + revalidatePath(admin.orders) + revalidatePath(admin.dashboard)
 → ok: message.success("Đã xác nhận thu tiền")
 → lỗi: NT-PAY-1008 (400) "Chỉ áp dụng xác nhận cho giao dịch COD"
        NT-PAY-1009 (400) "Giao dịch đang ở trạng thái "{x}", không thể chuyển trạng thái"
        NT-PAY-1001 (404) → message.warning nguyên câu + router.refresh()
```

---

## 3. Drawer chi tiết giao dịch (ảnh 11)

### 3.1 Wireframe

```
┌─────────────────────────────────────────┐
│ Giao dịch PAY-U1V2W3X4                ✕ │
├─────────────────────────────────────────┤
│ Mã giao dịch               PAY-U1V2W3X4 │
│ Phương thức                     [PayOS] │
│ Số tiền                   16.990.000₫   │ ← đỏ đậm
│ Trạng thái               [Đã hoàn tiền] │
│ Ngày                   21/07/2026 08:20 │
│ Đơn liên kết          Đơn # U1V2W3X4 ↗  │ ← link xanh + icon mở ngoài
└─────────────────────────────────────────┘
```

- antd `Drawer placement="right"` (≈ 280px trong ảnh) + `Descriptions column={1} size="small"` (nhãn xám trái, giá trị phải, mỗi dòng có đường kẻ).
- "Đơn liên kết ↗": `Link` tới `/admin/orders?view=<order_id>`, **cùng tab** (✅Q-T3) — giữ icon ↗ như mockup.
- Nếu `method=cod` & `status=pending` → thêm nút "Xác nhận đã thu" ở chân Drawer (cùng luồng §2, cùng component `ConfirmCodButton`).

### 3.2 Trường hiển thị

| Nhãn | Field API (detail) | Có trong mockup |
|---|---|---|
| Mã giao dịch | `id` → `formatPaymentCode()` | ✓ |
| Phương thức | `method` | ✓ |
| Số tiền | `amount` (+ `currency` = `VND`) | ✓ |
| Trạng thái | `status` | ✓ |
| Ngày | `paid_at` (`null` → `—`) | ✓ |
| Đơn liên kết | `order_id` | ✓ |
| Mã giao dịch PayOS | `transaction_id` | ✕ — thêm, chỉ hiện khi `method=payos` và có giá trị |
| Phản hồi cổng | `gateway_response` | ✕ — không hiện (dữ liệu thô) |

---

## 4. Bảng trạng thái giao dịch

```ts
// src/entities/transaction/types.ts
export type PaymentMethod = "cod" | "payos";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface AdminPaymentListItem {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
}

export interface AdminPaymentDetail extends AdminPaymentListItem {
  transaction_id: string | null;
  currency: string;
  gateway_response: unknown;
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; color: string }> = {
  success: { label: "Thành công", color: "green" },
  pending: { label: "Chờ thanh toán", color: "orange" },
  failed: { label: "Đã huỷ", color: "default" },   // ✅Q-T4 — chốt nhãn "Đã huỷ" (xám) theo mockup; backend gọi là failed
  refunded: { label: "Đã hoàn tiền", color: "purple" },
};

export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; color: string; longLabel: string }> = {
  payos: { label: "PayOS", color: "blue", longLabel: "Chuyển khoản / PayOS" },
  cod: { label: "COD", color: "green", longLabel: "Thanh toán khi nhận hàng (COD)" },
};
```

`longLabel` dùng lại ở Drawer đơn hàng (dòng "Phương thức" trong `04_Don_hang.md`).

```ts
// src/features/admin/transactions/payment.rules.ts
import type { AdminPaymentListItem } from "@/entities/transaction";
export const canConfirmCod = (p: Pick<AdminPaymentListItem, "method" | "status">) =>
  p.method === "cod" && p.status === "pending";
```

---

## 5. API backend

> Nguồn: `backend/be/src/admin/payment/*` (đã đọc — monolith), spec `design/ORDER/NT.PAYMENT/API_Spec.md`, gateway dòng 20.

| Hành động | Endpoint | Input | Output |
|---|---|---|---|
| Danh sách | `GET /api/admin/payments` | `method?`, `status?`, `page=1`, `limit=20` | `{ items: [{ id, order_id, method, amount, status, paid_at }], total, page, limit, totalPages }` (sắp `created_at DESC`; đã xin thêm `created_at` vào item — BE-5) |
| Chi tiết | `GET /api/admin/payments/:id` | | `{ id, order_id, method, transaction_id, amount, currency, status, gateway_response, paid_at }` |
| Xác nhận COD | `POST /api/admin/payments/:id/confirm-cod` | body rỗng | giao dịch sau cập nhật |

**Không có API:** hoàn tiền (spec: hoàn tiền làm tay, chỉ có cờ `needs_refund`, cột `refunded_amount`); tìm theo mã giao dịch/mã đơn.

---

## 6. Cấu trúc file

```
src/app/admin/transactions/page.tsx          # XOÁ: transactions/[id]/page.tsx (✅Q-04)
src/entities/transaction/{types,admin-service,index}.ts
src/features/admin/transactions/
├─ components/
│  ├─ TransactionToolbar.tsx    'use client'
│  ├─ TransactionTable.tsx      'use client' (tên theo instruction 3.2)
│  ├─ TransactionDetail.tsx     'use client' — Drawer + Descriptions
│  └─ ConfirmCodButton.tsx      'use client' — Modal.confirm + gọi action (instruction đặt ở admin/orders; chuyển sang đây theo ✅Q-O5)
├─ payment.rules.ts · payment.rules.test.ts
├─ actions.ts                   # confirmCodPayment
└─ index.ts
```

---

## 7. Test

| File | Case |
|---|---|
| `payment.rules.test.ts` | COD+pending → true; COD+success, PayOS+pending, COD+failed → false |
| `TransactionTable.test.tsx` | chỉ dòng COD chờ thanh toán có nút "Xác nhận đã thu"; tag đúng nhãn/màu (`failed` → "Đã huỷ"); `paid_at` null hiện `—`; mã GD dạng `PAY-XXXXXXXX`; link đơn trỏ `?view=<order_id>` |
| `ConfirmCodButton.test.tsx` | bấm → hiện hộp xác nhận; Huỷ không gọi action; OK gọi action 1 lần; lỗi `NT-PAY-1009` hiện message |
| `actions.test.ts` | role thiếu `payment:confirm-cod` bị chặn; `id` không phải UUID bị zod từ chối |

---

## 8. Quyết định đã chốt (2026-11-19)

| Mã | Vấn đề | Quyết định |
|---|---|---|
| Q-T1 | Mã GD từ UUID | ✅ `PAY-` + 8 ký tự đầu UUID viết hoa (`formatPaymentCode`), tooltip UUID đầy đủ |
| Q-T2 | Cột NGÀY thiếu `created_at` | ✅ Xin backend (BE-5); tạm hiện `paid_at`, null → `—` |
| Q-T3 | Link "Đơn liên kết" | ✅ Cùng tab, `/admin/orders?view=<order_id>` |
| Q-T4 | Nhãn cho `failed` | ✅ "Đã huỷ" (xám) — đúng chữ trong mockup |
| Q-T5 | Ô tìm kiếm | ✅ Không có (giữ đúng mockup) |
