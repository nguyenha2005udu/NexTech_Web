# PROGRESS — Khu quản trị (Admin)

> Ghi lại việc đã làm theo từng phần. Mỗi phần xong phải có: danh sách file, kết quả kiểm tra (`typecheck`, `lint`, `test`, `build`), điểm lệch so với tài liệu (nếu có).
> Tài liệu thiết kế: `project-knowledge/design/admin/` (đã chốt 2026-11-19).

## Tổng quan các phần

| Phần | Nội dung | Tài liệu | Trạng thái |
|---|---|---|---|
| 0 | Hạ tầng chung + Layout admin (`AdminShell`, menu, header, theme, routes, helper) | `00_Tong_quan_va_Layout_chung.md` | ✅ Xong (2026-11-19) |
| 1 | Tổng quan (Dashboard) | `01_Tong_quan.md` | ⏳ Chưa làm — **phần tiếp theo** |
| 2 | Danh mục | `02_Danh_muc.md` | ⏳ Chưa làm |
| 3 | Sản phẩm | `03_San_pham.md` | ⏳ Chưa làm |
| 4 | Đơn hàng | `04_Don_hang.md` | ⏳ Chưa làm |
| 5 | Mã giảm giá | `05_Ma_giam_gia.md` | ⏳ Chưa làm |
| 6 | Thanh toán | `06_Thanh_toan.md` | ⏳ Chưa làm |
| 7 | Người dùng | chưa có (chờ mockup) | ⏳ Chưa làm |

## Việc chờ backend

Xem `design/admin/00_Tong_quan_va_Layout_chung.md` §8 (BE-1 → BE-7). Chưa gửi — cần người phụ trách chuyển cho nhóm backend.

---

## Nhật ký

### 2026-11-19 — Phần 0: Hạ tầng chung + Layout admin ✅

**Hạ tầng dùng chung**

| File | Thay đổi |
|---|---|
| `src/types/api.ts` | **Mới.** `Paginated<T>` (`items, total, page, limit, totalPages` — đúng body backend), `AsyncStatus`, `HasId` |
| `src/lib/format.ts` | Thêm `formatDateTime` (`dd/MM/yyyy HH:mm`, giờ VN), `formatCompactVND` (`2,45 tỷ ₫`), `formatOrderCode` (`#A1B2C3D4`), `formatPaymentCode` (`PAY-A1B2C3D4`) |
| `src/lib/api/http.ts` | Thêm method `PATCH`; thêm `apiFetchForm()` (multipart, không tự đặt Content-Type); tách lõi chung `send()` |
| `src/lib/action-result.ts` | **Mới.** `invalid()` (lỗi zod → `fieldErrors`) và `failed(err, fieldByCode)` (ApiError → ActionFailure) |
| `src/features/auth/actions.ts` | Bỏ bản `invalid/failed` riêng, dùng `lib/action-result` (hành vi giữ nguyên) |
| `src/config/routes.ts` | Thêm `routes.admin.{dashboard, categories, products, orders, coupons, transactions, users}` |
| `src/config/theme.ts` | Thêm `adminColors`, `adminTheme` (xanh `#1677ff`, sider `#001529`, nền `#f0f2f5`, `inherit: true`) |
| `src/config/admin-nav.ts` | **Mới.** 7 mục menu (nhãn + tiêu đề header + href) và `findAdminNavItem(pathname)` |
| `src/hooks/useDebounce.ts` | **Mới.** Debounce mặc định 300ms |
| `src/hooks/useAdminListParams.ts` | **Mới.** `get / page / setParams` trên URL; đổi bộ lọc → về trang 1; `page/modal/id/view` không reset trang |
| `src/components/ui/icons.tsx` | Thêm icon: Dashboard, Shapes, Archive, Receipt, Tag, CreditCard, Users, Store, LogOut |

**Layout admin**

| File | Thay đổi |
|---|---|
| `src/components/layout/AdminShell.tsx` | **Mới.** `'use client'`: `ConfigProvider(adminTheme)` + Sider (logo "NexTech" + tag "Admin") + Header + Content |
| `src/components/layout/AdminSidebar.tsx` | **Mới.** Menu tối 7 mục, mục đang chọn theo pathname |
| `src/components/layout/AdminHeader.tsx` | **Mới.** Tiêu đề trang theo route · link "Về trang bán hàng" · Avatar (chữ đầu tên gọi) + Dropdown tên/email/Đăng xuất |
| `src/components/layout/AdminShell.module.css` | **Mới.** Sider dính, cao 100vh; header 56px; nội dung padding 16–20px |
| `src/app/admin/layout.tsx` | `requirePermission("admin:access")` → `<AdminShell>`; metadata `title: "Quản trị"`, `robots: noindex` |
| `src/app/admin/loading.tsx` | **Mới.** Skeleton thanh công cụ + bảng |
| `src/app/admin/error.tsx` | **Mới.** `Result` lỗi + nút "Thử lại" (`retry()`) |
| `src/app/admin/{categories,products,coupons}/new/page.tsx`, `src/app/admin/{categories,products,coupons,orders,transactions}/[id]/page.tsx` | **Xoá** (8 file rỗng `return null`) — theo Q-04 |

**Test & cấu hình test**

| File | Nội dung |
|---|---|
| `src/lib/format.test.ts` | 10 case (tiền, ngày giờ VN, rút gọn, mã đơn/giao dịch) |
| `src/lib/api/http.test.ts` | 5 case (PATCH + cookie, không body, lỗi mảng → ApiError, 503, multipart) |
| `src/lib/action-result.test.ts` | 6 case |
| `src/config/admin-nav.test.ts` | 9 case (khớp route, không nhầm tiền tố, thứ tự menu) |
| `src/hooks/useAdminListParams.test.ts` | 8 case (gồm `useDebounce` với fake timers) |
| `src/components/layout/AdminShell.test.tsx` | 9 case (tiêu đề, 7 link menu, mục đang chọn, link về shop, dropdown tài khoản, `avatarInitial`) |
| `jest.setup.ts` | Thêm stub `window.matchMedia` và `ResizeObserver` (jsdom không có; antd Layout/Menu cần) |
| `jest.config.ts` | Thêm ngưỡng coverage cho `lib/format.ts`, `lib/action-result.ts`, `lib/api/http.ts` |

**Kết quả kiểm tra**

| Lệnh | Kết quả |
|---|---|
| `npx jest --coverage` | 20 suite / **193 test xanh** (trước: 146). Coverage: `action-result` 100% dòng, `format` 93,9%, `http` 91,8% — đạt ngưỡng |
| `npx eslint src jest.setup.ts` | Sạch |
| `npx tsc --noEmit` | 0 lỗi trong mã nguồn |
| `npx next build` | ✅ Thành công. `/admin`, `/admin/{categories,coupons,orders,products,transactions,users}` đều `ƒ Dynamic` (SSR) |

**Ghi chú / lệch so với tài liệu**

- `.next/dev/types/` (file Next tự sinh khi chạy `next dev`) đã **xoá** vì còn trỏ tới route không tồn tại (`(auth)/reset-password` — lỗi có từ trước; và 8 route vừa xoá), làm `tsc` và `next build` báo lỗi. `next dev` sẽ tự sinh lại.
- `AdminShell` là **Client Component** (tài liệu ban đầu ghi Server) vì cần `ConfigProvider` + `Layout.Sider` của antd; trang con vẫn là Server Component qua `children`. Đã sửa tài liệu `00` §4.3.
- Next 16 đổi prop của `error.tsx` từ `reset` → `retry`. Đã sửa tài liệu `00` §5.
- Chữ trên logo dùng `siteConfig.name` ("NexTech"); mockup viết "NEXTech".
- `src/app/admin/users/[id]/page.tsx` **chưa xoá** — chờ thiết kế màn Người dùng (Phần 7).
- Các page admin hiện vẫn rỗng (`return null`); mỗi page sẽ gọi `requirePermission(...)` riêng khi làm phần tương ứng.
- **Chưa xem giao diện thật trên trình duyệt:** `/admin` cần đăng nhập bằng tài khoản admin qua backend (proxy + `requirePermission`). Giao diện mới được kiểm qua test RTL và build.

### 2026-11-19 — Tài liệu thiết kế

- Đọc 11 ảnh mockup (`frontend/ảnh/1–11.png`), chép vào `design/admin/assets/`.
- Đối chiếu hợp đồng API với code backend (`services/catalog`, `services/promotion`, `be/src/admin`).
- Viết 7 file tài liệu `design/admin/00`–`06`; chốt toàn bộ câu hỏi Q-xx theo phương án đề xuất.
- Danh sách việc cần backend bổ sung: `00_Tong_quan_va_Layout_chung.md` §8 (BE-1 → BE-7).

### Trạng thái ban đầu của repo (trước Phần 0)

- `npm test`: 14 suite / 146 test — xanh.
- `npm run typecheck` và `next build`: lỗi trong `.next/dev/types/validator.ts` (file tự sinh còn trỏ tới trang `(auth)/reset-password` đã bị xoá). Không thuộc mã nguồn.
