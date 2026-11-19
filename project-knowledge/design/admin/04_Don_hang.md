# 04 — Quản lý đơn hàng

| Mục | Giá trị |
|---|---|
| FDD | 8.2.1 Danh sách · 8.2.2 Chi tiết · 8.2.3 Cập nhật trạng thái |
| Route | `/admin/orders` (Drawer chi tiết: `/admin/orders?view=<orderId>`) |
| Ảnh | `assets/06-orders-list.png`, `assets/07-orders-drawer.png` |
| Quyền | `requirePermission("order:manage")` |
| Render | SSR, đọc `searchParams` (`q`, `status`, `page`, `view`) |
| Feature | `src/features/admin/orders/` |

---

## 1. Màn danh sách

### 1.1 Wireframe

```
Header: "Quản lý đơn hàng"                                         [🏬 Về trang bán hàng] (A)
[Tìm theo tên khách...    ] [Tất cả trạng thái ▾]                 (không có nút thêm)   ← placeholder đổi theo ✅Q-O1
┌────────────┬────────────────────┬───────┬──────────────┬────────────────┬──────────────────┬─────────┐
│ MÃ ĐƠN     │ KHÁCH HÀNG         │ SỐ SP │ TỔNG TIỀN    │ TRẠNG THÁI     │ NGÀY ĐẶT         │ THAO TÁC│
├────────────┼────────────────────┼───────┼──────────────┼────────────────┼──────────────────┼─────────┤
│ #A1B2C3D4  │ Nguyễn Văn A       │ 2     │ 64.980.000₫  │ [Đã thanh toán]│ 24/07/2026 10:24 │     Xem │
│            │ (email: ẩn tới khi backend trả user_email — ✅Q-O2)         │                  │         │
└────────────┴────────────────────┴───────┴──────────────┴────────────────┴──────────────────┴─────────┘
```

### 1.2 Toolbar

| # | Thành phần | Hành vi | URL → API |
|---|---|---|---|
| T1 | `Input` "Tìm theo tên khách..." | debounce 300ms | `?q=` → `search` |
| T2 | `Select` "Tất cả trạng thái" | Chờ xử lý / Đã thanh toán / Đang giao / Đã huỷ (thứ tự `ORDER_STATUS_META`) | `?status=` → `status` |

- ✅Q-O1: backend (`be/`) chỉ tìm theo **tên khách** (`user.full_name ILIKE`) → placeholder đổi thành "Tìm theo tên khách..." (mockup: "Tìm theo mã đơn / khách..."). Đã xin backend tìm thêm theo mã đơn (BE-2); khi có thì trả lại placeholder như mockup.
- API còn có `from`, `to` (lọc ngày) — không dùng (mockup không có ô ngày).

### 1.3 Cột bảng

| Cột | Mẫu | Hiển thị | Field API (list) |
|---|---|---|---|
| MÃ ĐƠN | `#A1B2C3D4` | Đậm, `Tooltip` UUID | `id` → `formatOrderCode()` (✅Q-D4) |
| KHÁCH HÀNG | Nguyễn Văn A / vana@gmail.com | Tên (đen); dòng email (xám, nhỏ) **chỉ hiện khi API có `user_email`** | `user_name`, `user_email?` — ✅Q-O2: API list hiện chưa trả email (BE-3) → tạm chỉ hiện tên |
| SỐ SP | 2 | Số | `product_count` (tổng số lượng các dòng) |
| TỔNG TIỀN | 64.980.000₫ | Đỏ, đậm | `total` |
| TRẠNG THÁI | Đã thanh toán | `Tag` (bảng màu §5) | `status` |
| NGÀY ĐẶT | 24/07/2026 10:24 | Xám | `created_at` → `formatDateTime()` |
| THAO TÁC | Xem | Link xanh, căn phải | → `?view=<id>` |

Phân trang server `limit=20`; bảng `sticky` + `scroll.y` như màn sản phẩm.

---

## 2. Drawer chi tiết đơn (ảnh 07)

### 2.1 Wireframe

```
┌───────────────────────────────────────────┐
│ Đơn #A1B2C3D4                          ✕ │
├───────────────────────────────────────────┤
│ KHÁCH HÀNG                                │
│ Nguyễn Văn A (đậm)                        │
│ vana@gmail.com (xám)                      │
├───────────────────────────────────────────┤
│ NGƯỜI NHẬN                                │
│ Nguyễn Văn A · 0912345678                 │
│ Số 12, đường Cầu Giấy, phường Dịch Vọng,  │
│ Hà Nội (xám)                              │
├───────────────────────────────────────────┤
│ SẢN PHẨM                                  │
│ [▮] Laptop UltraBook Pro 14 M3  34.990.000₫│ ← tên + "34.990.000₫ × 1" (xám); thành tiền đỏ bên phải
│ [▮] Điện thoại Galaxy S25 Ultra 29.990.000₫│
├───────────────────────────────────────────┤
│ TÓM TẮT THANH TOÁN                        │
│ Tạm tính                     64.980.000₫  │
│ Phí vận chuyển                  Miễn phí  │
│ Phương thức        Chuyển khoản / PayOS   │
│ ───────────────────────────────────────── │
│ Tổng cộng (đậm, lớn)    64.980.000₫ (đỏ)  │
│ Trạng thái               [Đã thanh toán]  │
│ Ngày đặt                24/07/2026 10:24  │
├───────────────────────────────────────────┤
│ TIẾN TRÌNH ĐƠN HÀNG                       │
│ (✓)Chờ xử lý ──(✓)Đã thanh toán ── (3)Đang giao │
│ Cập nhật trạng thái                       │
│ [Đang giao                            ▾]  │
│ ⚠ Đổi trạng thái sang "Đang giao"? Khách  │ ← Alert vàng, chỉ hiện khi chọn khác trạng thái hiện tại
│   hàng sẽ nhận được thông báo.            │
│ [          Lưu trạng thái              ]  │ ← Button primary block
└───────────────────────────────────────────┘
```

- antd `Drawer placement="right" width={380}` (ảnh ≈ 300px trên khung 1250px; nới cho đủ chỗ tên sản phẩm dài). Tiêu đề "Đơn #<mã>", nút ✕ góc phải.
- Nhãn mục (KHÁCH HÀNG, NGƯỜI NHẬN, …) IN HOA, xám, cỡ nhỏ; các mục ngăn bằng `Divider`.

### 2.2 Chi tiết từng mục

| Mục | Dữ liệu | Field API (detail, `be/`) | Ghi chú |
|---|---|---|---|
| Khách hàng | tên, email | `user.full_name`, `user.email` | |
| Người nhận | tên · SĐT; địa chỉ | `shipping_recipient_name?`, `shipping_phone_number?`, `shipping_full_address?` — **chưa có** trong response `be/` | ✅Q-O3: field nào thiếu hiện `—` (BE-4). Vẫn giữ mục "NGƯỜI NHẬN" như mockup |
| Sản phẩm | ảnh, tên, `đơn giá × SL`, thành tiền | `items[].product.{name, price}`, `items[].quantity`, `items[].product_image?` | ✅Q-O3: thiếu ảnh → ô xám giữ chỗ 40×40 (BE-4). Thành tiền = `price × quantity` |
| Tạm tính | | `subtotal` | |
| Phí vận chuyển | "Miễn phí" khi = 0 | `shipping_fee` | |
| **Giảm giá** | `−5.000.000 ₫` (xanh lá), **chỉ hiện khi > 0** | `discount_amount` | ✅Q-O4 — dòng thêm, mockup chưa có; đặt sau "Phí vận chuyển" |
| Phương thức | `PAYMENT_METHOD_META[method].longLabel`: "Chuyển khoản / PayOS" / "Thanh toán khi nhận hàng (COD)" | `payment.method` (`payos` \| `cod`); `payment = null` → `—` | |
| Tổng cộng | đỏ, đậm, lớn | `total` | |
| Trạng thái | `Tag` | `status` | |
| Ngày đặt | | `created_at` | |
| Ghi chú | chỉ hiện khi có, chữ nghiêng xám | `note` | mockup không vẽ |

### 2.3 Tiến trình đơn hàng (`OrderTimeline`)

- antd `Steps size="small"`, 3 bước trong mockup: **Chờ xử lý → Đã thanh toán → Đang giao**; bước đã qua có ✓ xanh, bước chưa tới hiện số xám.
- Map theo backend (bước 3 "Đang giao" = `shipped`, không có bước "Hoàn tất" — ✅Q-D3):

| `status` hiện tại | PayOS | COD |
|---|---|---|
| `pending` | bước 1 đang chờ | bước 1 |
| `paid` | ✓1, ✓2 | (không xảy ra) |
| `shipped` | ✓1 ✓2 ✓3 | ✓1, bước 2 đổi nhãn "Đã thu tiền" ✓, ✓3 |
| `cancelled` | `Steps status="error"` ở bước đang dừng + nhãn "Đã huỷ" | như PayOS |

### 2.4 Cập nhật trạng thái

**Luật chuyển trạng thái** (`backend/project-knowledge/business-spec/NT.BUSINESS_RULES.md` §5; spec NT.ORDER: API "chỉ nhận `shipped`, `cancelled`"):

| Từ | Sang được | Điều kiện |
|---|---|---|
| `pending` | `shipped` | chỉ đơn **COD** (backend tự đánh dấu giao dịch COD thành công trong cùng transaction — đọc code `be/`) |
| `pending` | `cancelled` | |
| `paid` | `shipped` | |
| `paid` | `cancelled` | phải **hoàn tiền tay** |
| `shipped`, `cancelled` | — | trạng thái cuối |

Admin **không** đặt `paid` bằng tay.

**UI:**
- `Select` chỉ liệt kê trạng thái **được phép** từ trạng thái hiện tại (`adminNextStatuses(order)`); mặc định = trạng thái hiện tại (không đổi).
- Không còn bước nào → ẩn `Select` + nút, hiện chữ xám "Đơn đã ở trạng thái cuối".
- Chọn khác hiện tại → `Alert type="warning"`: `Đổi trạng thái sang "<nhãn>"? Khách hàng sẽ nhận được thông báo.` (đúng câu trong ảnh).
  Nếu `paid → cancelled`: thêm câu "Đơn đã thanh toán — cần hoàn tiền thủ công cho khách." (backend không có API hoàn tiền).
  Nếu `pending → shipped` (COD): thêm câu "Giao dịch COD sẽ được ghi nhận đã thu tiền." (backend tự làm trong cùng transaction).
- **Không** có nút "Xác nhận đã thu" trong drawer đơn (✅Q-O5) — việc đó làm ở màn Thanh toán.
- "Lưu trạng thái" disabled khi chưa đổi; `loading` khi gửi.
- Thành công: `message.success("Đã cập nhật trạng thái")`, `router.refresh()` (bảng + drawer cập nhật), drawer vẫn mở.
- Lỗi: `NT-ORD-1007` (400) "Không thể chuyển đơn từ "{a}" sang "{b}"" → `message.warning` nguyên câu; `NT-ORD-1012` (409) "Đơn hàng đang được xử lý, vui lòng thử lại sau"; `NT-ORD-1006` (404).

---

## 3. Luồng

```
page.tsx (Server)
 ├─ requirePermission("order:manage")
 ├─ list = adminOrderService.list({ search: q, status, page })
 ├─ detail = view ? adminOrderService.get(view) : null      (404 → bỏ qua, hiện message "Không tìm thấy đơn hàng")
 └─ <OrderTable …/> + <OrderDetailDrawer order={detail} />  (open = detail !== null)
Đóng drawer → router.replace(URL bỏ ?view, scroll:false)
Lưu trạng thái → Server Action updateOrderStatus → revalidatePath(admin.orders) + revalidatePath(admin.dashboard)
```

---

## 4. API backend

> Nguồn: `backend/be/src/admin/order/*` (đã đọc — monolith, code đang chạy), spec `design/ORDER/NT.ORDER/API_Spec.md` (order-service, thư mục code `services/order/src/modules/admin-order` hiện **rỗng**), gateway dòng 16.

| Hành động | Endpoint | Input | Output (`be/`) |
|---|---|---|---|
| Danh sách | `GET /api/admin/orders` | `search?`, `status?`, `from?`, `to?`, `page=1`, `limit=20` | `{ items: [{ id, user_name, product_count, total, status, created_at }], total, page, limit, totalPages }` |
| Chi tiết | `GET /api/admin/orders/:id` | | `{ id, user: { id, full_name, email, phone_number }, items: [{ product: { id, name, price }, quantity }], subtotal, shipping_fee, discount_amount, total, status, note, payment, created_at }` — đã xin thêm các trường người nhận + ảnh SP (BE-4) |
| Đổi trạng thái | `PUT /api/admin/orders/:id/status` | `{ status }` | đơn sau cập nhật |

**Enum `status` lệch giữa 2 nguồn** [Unverified — cần backend chốt]:
- `be/` DTO: `simulated_success | cancelled | pending | paid | shipped`
- order-service (Component_Class_Design): `processing | pending | paid | shipped | cancelled | failed`

→ Web khai báo union đủ cả hai, nhãn lạ hiện "Không xác định".

---

## 5. Bảng trạng thái dùng chung

```ts
// src/entities/order/status.ts — dùng cho admin (bảng, dashboard) và trang đơn của khách
export type OrderStatus = "processing" | "pending" | "paid" | "shipped" | "cancelled" | "failed" | "simulated_success";

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "orange" },        // ảnh: vàng cam
  paid: { label: "Đã thanh toán", color: "blue" },         // ảnh: xanh dương
  shipped: { label: "Đang giao", color: "cyan" },          // ảnh: xanh ngọc — ✅Q-D3: trạng thái cuối, không có "Hoàn tất"
  cancelled: { label: "Đã huỷ", color: "red" },            // ảnh: đỏ
  processing: { label: "Đang tạo đơn", color: "default" }, // [Inference] không có trong mockup
  failed: { label: "Thất bại", color: "default" },         // [Inference]
  simulated_success: { label: "Đã thanh toán (giả lập)", color: "blue" }, // [Inference]
};
```

`Tag` trong ảnh là nền đặc + chữ trắng → dùng màu "solid" của antd v6 (`<Tag color="blue" variant="solid">`) [Unverified — kiểm lại prop `variant` của antd 6.7 khi code].

```ts
// src/features/admin/orders/order-status.rules.ts — logic thuần, test kỹ
import type { OrderStatus } from "@/entities/order";

export type PaymentMethod = "cod" | "payos";

export function adminNextStatuses(status: OrderStatus, method: PaymentMethod | null): OrderStatus[] {
  switch (status) {
    case "pending":
      return method === "cod" ? ["shipped", "cancelled"] : ["cancelled"];
    case "paid":
      return ["shipped", "cancelled"];
    default:
      return [];
  }
}
```

```ts
// src/features/admin/orders/actions.ts (trích)
"use server";
// FDD 8.2.3 — Cập nhật trạng thái đơn
const updateStatusSchema = z.object({ id: z.uuid(), status: z.enum(["shipped", "cancelled"]) });

export async function updateOrderStatus(input: unknown): Promise<ActionResult> {
  await requirePermission("order:manage");
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await apiFetch(`/api/admin/orders/${parsed.data.id}/status`, { method: "PUT", body: { status: parsed.data.status } });
  } catch (err) {
    return failed(err); // NT-ORD-1007 / 1012 / 1006 → message chung
  }
  revalidatePath(routes.admin.orders);
  revalidatePath(routes.admin.dashboard);
  return { ok: true };
}
```

> Backend là nơi kiểm luật thật; `adminNextStatuses` chỉ để UI không cho chọn sai.

---

## 6. Cấu trúc file

```
src/app/admin/orders/page.tsx           # XOÁ: orders/[id]/page.tsx (✅Q-04)
src/entities/order/{types,status,admin-service,index}.ts
src/features/admin/orders/
├─ components/
│  ├─ AdminOrderToolbar.tsx      'use client'
│  ├─ AdminOrderTable.tsx        'use client'
│  ├─ OrderDetailDrawer.tsx      'use client' — khung Drawer, đóng = bỏ ?view
│  ├─ OrderTimeline.tsx
│  └─ OrderStatusUpdater.tsx     'use client' (tên theo instruction 3.2)
├─ order-status.rules.ts · order-status.rules.test.ts
├─ actions.ts
└─ index.ts
```

---

## 7. Test

| File | Case |
|---|---|
| `order-status.rules.test.ts` | `pending`+COD → [shipped, cancelled]; `pending`+PayOS → [cancelled]; `paid` → [shipped, cancelled]; `shipped`/`cancelled` → [] |
| `OrderStatusUpdater.test.tsx` | chưa đổi → nút disabled, không có Alert; chọn "Đang giao" → hiện đúng câu cảnh báo; trạng thái cuối → không có Select; lỗi `NT-ORD-1007` → hiện message |
| `actions.test.ts` | role `user` bị chặn; `status: "paid"` bị zod từ chối |
| `OrderDetailDrawer.test.tsx` | thiếu trường người nhận → hiện `—`; `discount_amount = 0` không có dòng "Giảm giá", `> 0` có; không có nút "Xác nhận đã thu" |
| `AdminOrderTable.test.tsx` | không có `user_email` → không render dòng email |

---

## 8. Quyết định đã chốt (2026-11-19)

| Mã | Vấn đề | Quyết định |
|---|---|---|
| Q-O1 | API chỉ tìm theo tên khách | ✅ Placeholder "Tìm theo tên khách..."; xin backend tìm theo mã đơn (BE-2) |
| Q-O2 | API list thiếu email khách | ✅ Ẩn dòng email tới khi có `user_email` (BE-3) |
| Q-O3 | Chi tiết thiếu người nhận / SĐT / địa chỉ / ảnh SP | ✅ Hiện `—` / ô giữ chỗ; xin backend bổ sung (BE-4) |
| Q-O4 | Dòng "Giảm giá" | ✅ Thêm, chỉ hiện khi `discount_amount > 0` |
| Q-O5 | Nút xác nhận thu COD ở drawer đơn | ✅ Không có; chỉ ở màn Thanh toán. Lệch có chủ đích so với bảng 3.3 instruction (8.2.6 ghi `/admin/orders/[id]`) — ghi vào mô tả PR |
