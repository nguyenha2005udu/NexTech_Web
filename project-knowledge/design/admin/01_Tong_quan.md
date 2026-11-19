# 01 — Tổng quan (Dashboard)

| Mục | Giá trị |
|---|---|
| FDD | 8.1 — Thống kê doanh thu, số lượng bán, tồn kho |
| Route | `/admin` → `src/app/admin/page.tsx` |
| Ảnh | `assets/01-dashboard.png` |
| Quyền | `requirePermission("stats:read")` |
| Render | SSR (cookie phiên → dynamic) |
| Feature | `src/features/admin/dashboard/` |
| Layout chung | Xem `00_Tong_quan_va_Layout_chung.md` §2 |

---

## 1. Wireframe

```
Header: "Tổng quan"                                        [🏬 Về trang bán hàng] (A)
┌───────────────────┬───────────────────┬───────────────────┬───────────────────┐
│ [🧾] Tổng đơn hàng │ [💵] Doanh thu     │ [📦] Số sản phẩm   │ [👥] Người dùng    │  ← 4 StatCard
│      1240         │      2,45 tỷ₫     │      18           │      8.320        │
│  (bỏ dòng ▲ +x% — ✅Q-D1)                                                       │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┘
┌──────────────────────────────────────────────────┬─────────────────────────────┐
│ Doanh thu theo tháng                              │ Đơn theo trạng thái          │
│  ▆  █  ▇  █  █  █  █  █  █  █  █  █              │ Chờ xử lý            18%     │
│  T1 T2 T3 T4 T5 T6 T7 T8 T9 T10 T11 T12           │ ███░░░░░░░░░░░░░░░           │
│  (cột xanh gradient, không trục Y, không số)       │ Đã thanh toán        42% ... │
└──────────────────────────────────────────────────┴─────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Đơn hàng mới nhất                                                                │
│ MÃ ĐƠN     │ KHÁCH HÀNG   │ TỔNG TIỀN      │ TRẠNG THÁI     │ NGÀY              │
│ #A1B2C3D4  │ Nguyễn Văn A │ 64.980.000₫    │ [Đã thanh toán]│ 24/07/2026 10:24  │
│ ... 5 dòng                                                                        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Tỷ lệ cột: hàng 2 ≈ 2/3 (biểu đồ) + 1/3 (trạng thái) → `Row gutter={16}` + `Col xs={24} lg={16}` / `Col xs={24} lg={8}`. Hàng 1: `Col xs={24} sm={12} xl={6}`.

---

## 2. Thành phần chi tiết

### 2.1 Thẻ số liệu `StatCards`

| # | Nhãn | Giá trị mẫu | Icon (ô vuông bo góc, nền nhạt) | Nguồn dữ liệu |
|---|---|---|---|---|
| S1 | Tổng đơn hàng | `1240` | Hoá đơn, nền xanh dương nhạt | `overview.total_orders` |
| S2 | Doanh thu | `2,45 tỷ₫` | Tờ tiền, nền xanh lá nhạt | `overview.total_revenue` |
| S3 | Số sản phẩm | `18` | Hộp/kho, nền tím nhạt | `overview.total_products` |
| S4 | Người dùng | `8.320` | Nhóm người, nền cam nhạt | `overview.total_users` |

- ✅Q-D1: **không hiện** dòng tăng trưởng (`▲ +12%`, `+8,5%`, `+3`, `+21%`) vì backend không trả số liệu này. Backlog BE-6 (file 00 §8). Thẻ giữ chiều cao như mockup (căn giữa theo chiều dọc).
- Dựng bằng HTML + CSS Module (icon + text), không dùng `Statistic` vì `Statistic` không có ô icon bên trái giống ảnh.
- Định dạng: số nguyên `Intl.NumberFormat("vi-VN")` (`8.320`). Doanh thu rút gọn: ≥ 1 tỷ → `2,45 tỷ ₫`; ≥ 1 triệu → `x,xx triệu ₫`; còn lại `formatVND()` → thêm `formatCompactVND()` vào `src/lib/format.ts` (có khoảng trắng trước `₫`, thống nhất ✅Q-06).
- Khi một service backend sập, trường tương ứng = `null` và tên service nằm trong `unavailable[]` → thẻ hiện `—` + `Tooltip` "Chưa lấy được dữ liệu".

### 2.2 Biểu đồ `RevenueChart` — "Doanh thu theo tháng"

| Thuộc tính | Mockup |
|---|---|
| Kiểu | Cột dọc, 12 cột T1…T12, màu xanh dương gradient (đậm dưới, nhạt trên), bo góc trên |
| Trục | Chỉ nhãn trục X `T1`…`T12`; **không** trục Y, không lưới, không giá trị trên cột |
| Tương tác | Mockup không vẽ → `Tooltip` khi hover: "Tháng 7/2026 · 41.500.000 ₫ · 23 đơn" |

- ✅Q-D2: **tự vẽ bằng CSS**, không thêm thư viện chart. Mỗi cột là `div` có `height: calc(var(--ratio) * 100%)`, Server Component (không tốn JS client, tốt cho INP). `Tooltip` là phần lá client duy nhất (`RevenueBarTooltip.tsx`).
- ✅Q-D5: hiển thị **năm hiện tại** (giờ `Asia/Ho_Chi_Minh`, tính ở server), không có ô chọn năm.
- Tháng không có doanh thu → cột cao 0 (vẫn hiện nhãn). Năm chưa có doanh thu nào → cả 12 cột cao 0 + chữ xám "Chưa có doanh thu trong năm <năm>".
- Mỗi cột có `aria-label` "Tháng 7: 41.500.000 ₫" để đọc được bằng trình đọc màn hình.

### 2.3 Khối `OrderStatusBreakdown` — "Đơn theo trạng thái"

| Nhãn | % mẫu | Màu thanh | Map enum backend |
|---|---|---|---|
| Chờ xử lý | 18% | Cam/vàng | `pending` |
| Đã thanh toán | 42% | Xanh dương | `paid` |
| Đang giao | 25% | Xanh ngọc (cyan) | `shipped` |
| Đã huỷ | 8% | Đỏ | `cancelled` |
| ~~Hoàn tất~~ | ~~7%~~ | — | ✅Q-D3: **bỏ dòng này** — backend không có trạng thái tương ứng (backlog BE-7) |

- Trạng thái khác do backend trả (`processing`, `failed`, `simulated_success`) xếp sau 4 dòng trên, chỉ hiện khi `count > 0`, nhãn/màu lấy từ `ORDER_STATUS_META`.

- antd: `Progress percent={x} showInfo={false} strokeColor={…} size="small"`; nhãn trái, % phải (xám).
- % = `count / Σcount × 100`, làm tròn số nguyên. Tổng làm tròn có thể ≠ 100% [Inference — chấp nhận].
- Thứ tự & màu lấy từ `ORDER_STATUS_META` (dùng chung với màn Đơn hàng, xem `04_Don_hang.md` §5).

### 2.4 Bảng `LatestOrdersTable` — "Đơn hàng mới nhất"

| Cột | Mẫu | Kiểu hiển thị | Field |
|---|---|---|---|
| MÃ ĐƠN | `#A1B2C3D4` | Đậm, `Tooltip` = UUID đầy đủ | `id` → `formatOrderCode(id)` (✅Q-D4) |
| KHÁCH HÀNG | `Nguyễn Văn A` | Thường | `user_name` |
| TỔNG TIỀN | `64.980.000₫` | Đỏ, đậm | `total` |
| TRẠNG THÁI | `Đã thanh toán` | `Tag` màu | `status` |
| NGÀY | `24/07/2026 10:24` | Xám | `created_at` → `formatDateTime()` |

- 5 dòng, không phân trang, không cột thao tác. Bấm dòng → `/admin/orders?view=<id>` (mở Drawer chi tiết, ✅Q-04).
- Rỗng: "Chưa có đơn hàng".

---

## 3. Luồng dữ liệu

```
page.tsx (Server)
 ├─ requirePermission("stats:read")
 ├─ Promise.all([
 │    dashboardService.overview(),                      → StatCards, OrderStatusBreakdown
 │    dashboardService.revenueByMonth(year),             → RevenueChart
 │    adminOrderService.list({ page: 1, limit: 5 }),     → LatestOrdersTable
 │  ])
 └─ render <DashboardView … />
```

- Ba khối độc lập → [Inference] bọc từng khối bằng `<Suspense fallback={<Skeleton/>}>` để stream, một khối chậm không chặn cả trang.
- Không có thao tác ghi → không có Server Action.

---

## 4. API backend

> Nguồn đã đọc: `backend/be/src/admin/statistics/*` (code monolith), `backend/project-knowledge/design/ORDER/NT.ORDER/API_Spec.md`, `NT.PAYMENT/API_Spec.md`, gateway `NT.GATEWAY/API_Spec.md` §2 (dòng 17–18, mức `admin`).

| Mục đích | Endpoint | Query | Response |
|---|---|---|---|
| Thẻ số + trạng thái | `GET /api/admin/statistics/overview` | `from?`, `to?` (lọc doanh thu) | `{ total_orders, total_revenue, total_products, active_products, total_users, orders_by_status: [{ status, count }], unavailable: string[] }` (theo spec NT.ORDER) |
| Biểu đồ | `GET /api/admin/statistics/revenue` | `groupBy=month` (mặc định), `from`, `to` (ISO date) | `{ group_by, items: [{ period: "YYYY-MM-DD", revenue: number, order_count: number }] }` (đọc code `be/`) |
| 5 đơn mới nhất | `GET /api/admin/orders?page=1&limit=5` | | `Paginated<AdminOrderListItem>` — xem `04_Don_hang.md` §4. [Unverified] thứ tự mặc định là mới nhất trước |

- Doanh thu = tổng giao dịch `success` (spec NT.PAYMENT §2).
- `revenue` chỉ trả **tháng có dữ liệu** → web phải tự lấp đủ 12 tháng = 0.

**Không có API cho:** % tăng trưởng 4 thẻ; "+3" sản phẩm → không hiện (✅Q-D1).

---

## 5. Type & service đề xuất

```ts
// src/entities/statistics/types.ts  (entity mới)
import type { OrderStatus } from "@/entities/order";

export interface OverviewStats {
  total_orders: number | null;
  total_revenue: number | null;
  total_products: number | null;
  active_products: number | null;
  total_users: number | null;
  orders_by_status: Array<{ status: OrderStatus; count: number }>;
  unavailable: string[];
}

export interface RevenuePoint { period: string; revenue: number; order_count: number }
export interface RevenueStats { group_by: "week" | "month"; items: RevenuePoint[] }
```

```ts
// src/entities/statistics/service.ts
import "server-only";
import { apiFetch } from "@/lib/api/http";
import type { OverviewStats, RevenueStats } from "./types";

export const statisticsService = {
  overview: () => apiFetch<OverviewStats>("/api/admin/statistics/overview"),
  revenueByMonth: (year: number) =>
    apiFetch<RevenueStats>(`/api/admin/statistics/revenue?groupBy=month&from=${year}-01-01&to=${year}-12-31`),
};
```

```ts
// src/features/admin/dashboard/revenue.ts — logic thuần, test kỹ
import type { RevenuePoint } from "@/entities/statistics";

export interface MonthBar { month: number; label: string; revenue: number; ratio: number }

/** Lấp đủ T1–T12 (tháng thiếu = 0) và tính tỉ lệ chiều cao theo tháng lớn nhất. */
export function toMonthlyBars(items: RevenuePoint[]): MonthBar[] {
  const byMonth = new Map(items.map((p) => [Number(p.period.slice(5, 7)), p.revenue]));
  const bars = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, label: `T${i + 1}`, revenue: byMonth.get(i + 1) ?? 0 }));
  const max = Math.max(...bars.map((b) => b.revenue), 1);
  return bars.map((b) => ({ ...b, ratio: b.revenue / max }));
}
```

---

## 6. Cấu trúc file

```
src/app/admin/page.tsx                         # FDD 8.1 — ghép DashboardView
src/entities/statistics/{types,service,index}.ts
src/features/admin/dashboard/
├─ components/
│  ├─ DashboardView.tsx        # Server — Row/Col bố cục
│  ├─ StatCards.tsx            # Server
│  ├─ RevenueChart.tsx         # Server (CSS bar) + RevenueBarTooltip.tsx ('use client')
│  ├─ OrderStatusBreakdown.tsx # Server — antd Progress
│  ├─ LatestOrdersTable.tsx    # 'use client' (antd Table cần client)
│  └─ dashboard.module.css
├─ revenue.ts · revenue.test.ts
└─ index.ts
```

> Lưu ý: antd `Table`, `Progress`, `Tooltip` là Client Component (antd v6 không có bản RSC) [Unverified — cần kiểm khi code]. Nếu đúng, `StatCards`/`RevenueChart` viết bằng HTML + CSS Module để giữ ở server; chỉ phần dùng antd mới `'use client'`.

---

## 7. Trạng thái màn [Inference]

| Trạng thái | Hiển thị |
|---|---|
| Đang tải | `loading.tsx`: 4 `Skeleton` thẻ + khối chart + bảng |
| `unavailable` khác rỗng | `Alert type="warning" showIcon` đầu trang: "Một số số liệu tạm thời chưa lấy được" |
| Lỗi toàn trang | `error.tsx` |

---

## 8. Test

| File | Case |
|---|---|
| `revenue.test.ts` | lấp đủ 12 tháng; tháng thiếu = 0; `ratio` của tháng lớn nhất = 1; mảng rỗng không chia 0 |
| `format.test.ts` | `formatCompactVND(2_450_000_000)` = `"2,45 tỷ ₫"`; `< 1 triệu` dùng `formatVND`; `formatOrderCode` cắt 8 ký tự, viết hoa, bỏ `-` |
| `OrderStatusBreakdown.test.tsx` | tính % đúng; tổng 0 → mọi thanh 0%; không có dòng "Hoàn tất"; trạng thái phụ `count = 0` không hiện |

---

## 9. Quyết định đã chốt (2026-11-19)

| Mã | Vấn đề | Quyết định |
|---|---|---|
| Q-D1 | API không trả % tăng trưởng | ✅ Không hiện dòng tăng trưởng ở cả 4 thẻ. Backlog BE-6 |
| Q-D2 | Biểu đồ | ✅ Tự vẽ bằng CSS, không thêm thư viện |
| Q-D3 | "Đang giao" / "Hoàn tất" | ✅ `shipped` = "Đang giao"; bỏ "Hoàn tất" cho tới khi backend có `delivered` (BE-7) |
| Q-D4 | Mã đơn từ UUID | ✅ `#` + 8 ký tự đầu UUID viết hoa (`formatOrderCode`), tooltip UUID đầy đủ |
| Q-D5 | Chọn năm cho biểu đồ | ✅ Năm hiện tại, không có ô chọn năm |
