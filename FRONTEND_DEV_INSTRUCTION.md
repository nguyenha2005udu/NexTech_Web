# FRONTEND DEV INSTRUCTION — NexTech Web App (Next.js + TypeScript)

> **Người viết:** PM dự án · **Đối tượng:** toàn bộ dev frontend · **Nguồn:** *Sơ đồ phân rã chức năng (FDD) NexTech — phần Web App* + 8 buổi học phần *Lập trình Web nâng cao* (TypeScript nâng cao → Design Pattern → Redux Toolkit → Zustand/Context → Performance → Testing → Next.js SSR/SSG/ISR → Next.js nâng cao).
>
> Tài liệu này là **luật chơi chung**. Cái gì ghi là **BẮT BUỘC** thì reviewer sẽ reject PR nếu vi phạm. Cái gì ghi là **NÊN** thì cần lý do khi làm khác. Có thắc mắc → hỏi PM/Tech Lead trước khi code, đừng tự "sáng tạo" kiến trúc.

---

## 0. TL;DR — 12 luật vàng

1. **Không dùng `any`.** Ở bất kỳ đâu. ESLint chặn ở mức `error`.
2. **Mặc định là Server Component.** Chỉ thêm `'use client'` ở *lá* của cây cần state/sự kiện/API trình duyệt.
3. **Mỗi trang chọn đúng chiến lược render** theo bảng ở mục 5 (SSG → ISR → SSR → CSR). Phải giải thích được vì sao.
4. **Đúng công cụ cho đúng loại state:** dữ liệu server → Server Component/RTK Query; state nghiệp vụ toàn cục → Redux Toolkit; state UI vặt → `useState`/Zustand; state ít đổi (theme) → Context đã tách nhỏ.
5. **Chỉ dùng `useAppSelector` / `useAppDispatch`.** Không import `useSelector`/`useDispatch` trực tiếp.
6. **Không tạo Redux store singleton.** Dùng `makeStore()` + `StoreProvider` (mỗi request một store).
7. **Bảo mật nhiều lớp:** Middleware → Page → Server Action/Route Handler → tầng dữ liệu. Ẩn nút ở UI **không phải** bảo mật.
8. **Mọi Server Action:** kiểm tra `auth()` + quyền `can()` + validate input bằng `zod`.
9. **Đo trước, tối ưu sau.** Không rắc `useMemo/useCallback/React.memo` khắp nơi khi chưa có số liệu Profiler.
10. **Test hành vi, không test cài đặt.** RTL + `getByRole` trước tiên. Coverage module được giao ≥ 70%.
11. **Không commit secret.** `.env.local` nằm trong `.gitignore`; secret không bao giờ có tiền tố `NEXT_PUBLIC_`.
12. **Đo Lighthouse trên bản production** (`npm run build && npm start`), **không** đo trên `npm run dev`.

---

## 1. Bối cảnh & phạm vi

**NexTech** — hệ thống mua sắm thiết bị và linh kiện điện tử, tích hợp trợ lý AI. Tài liệu này chỉ áp dụng cho **phần Web App**, theo *Sơ đồ phân rã chức năng (FDD)* gồm 8 nhánh:

| Mã FDD | Nhánh chức năng | Ai dùng |
|---|---|---|
| **1** | Tài khoản và hồ sơ | Khách (đăng ký/đăng nhập), Người dùng |
| **2** | Khám phá và tìm kiếm sản phẩm | Khách, Người dùng |
| **3** | Tư vấn mua sắm bằng AI | Khách (hội thoại tạm theo phiên), Người dùng |
| **4** | Giỏ hàng và đặt hàng | Người dùng (khách có giỏ tạm) |
| **5** | Thanh toán và quản lý đơn hàng | Người dùng |
| **6** | Thông báo và theo dõi giá | Người dùng |
| **7** | Quản lý danh mục, sản phẩm và tồn kho | Admin |
| **8** | Vận hành và quản trị cửa hàng | Admin |

> **Ngoài phạm vi web:** 1.1.7 *Mở khoá bằng sinh trắc học* là chức năng của app mobile. Nếu muốn có trên web thì làm bằng WebAuthn/Passkey. Việc này để ở backlog, không làm trong đồ án.

**Yêu cầu chấm điểm đồ án (không thương lượng):**

| # | Yêu cầu | Nguồn |
|---|---------|-------|
| R1 | Next.js App Router + TypeScript, **không `any`** | Buổi 1, 7 |
| R2 | Có đủ **SSR, SSG, ISR** (mỗi chiến lược ≥ 1 trang, giải thích được lý do) | Buổi 7 |
| R3 | **State management tập trung** (Redux Toolkit cho state nghiệp vụ chính: giỏ hàng) | Buổi 3, 4 |
| R4 | **Đăng nhập** OAuth (Google, Facebook) + email/mật khẩu; **phân quyền 2 vai trò** `admin`, `user` | Buổi 8, FDD 1.1 |
| R5 | **Test Jest/RTL cho ≥ 2 module**, coverage module ≥ 70% | Buổi 6 |
| R6 | **SEO:** metadata động, sitemap, robots, canonical, opengraph-image, JSON-LD | Buổi 7, 8 |
| R7 | Báo cáo **Lighthouse trước/sau** tối ưu | Buổi 5, 7, 8 |

**Điểm cộng:** RTK Query cho dữ liệu phía client; streaming câu trả lời AI; virtualization cho bảng admin lớn; intercepting route (modal xem nhanh sản phẩm).

**Giả định kỹ thuật — chốt lại trong Sprint 0:**
1. **Backend là REST API riêng** (NestJS ở các buổi sau). Next.js đóng vai frontend + lớp BFF (Backend for Frontend) mỏng: Server Component/Server Action gọi backend qua `lib/api/http.ts`. **Webhook PayOS** và **job quét cảnh báo giá** chạy ở backend, không nằm trong repo web.
2. **Giỏ hàng của khách** lưu ở client (localStorage). Sau khi đăng nhập thì gộp lên server. **Đặt hàng bắt buộc đăng nhập.**
3. **Hội thoại AI của khách** lưu theo phiên trình duyệt (sessionStorage + `conversationId` do backend cấp). Sau khi đăng nhập, hỏi người dùng có muốn lưu không, đồng ý thì gắn vào tài khoản (FDD 3.3).
4. **Thông báo**: polling 30s bằng RTK Query; nâng lên SSE nếu backend hỗ trợ.
5. **Vai trò:** `guest` · `user` · `admin`. **Trạng thái tài khoản:** `active` · `locked` (FDD 8.4.4).

---

## 2. Tech stack (chốt)

| Hạng mục | Lựa chọn | Ghi chú |
|----------|----------|---------|
| Framework | **Next.js (App Router)** + React | Slide viết theo Next.js 15. **Sprint 0 chốt version cụ thể** và ghi vào README (ví dụ: bản mới đổi `middleware.ts` → `proxy.ts`). |
| Ngôn ngữ | TypeScript `strict: true` | |
| State nghiệp vụ | **Redux Toolkit** (+ RTK Query) | `react-redux` |
| State UI phụ | **Zustand** | hội thoại AI theo phiên, launcher, drawer, modal |
| State ít đổi | Context API (đã tách nhỏ + `useMemo`) | theme, locale |
| Auth | **Auth.js v5** (`next-auth@beta`) | GitHub OAuth + Credentials |
| Validate | `zod` | Server Action, form |
| Thanh toán | **COD** + **PayOS/VietQR** (chuyển hướng sang PayOS rồi quay về `returnUrl`) | Webhook xác nhận do backend xử lý |
| Trợ lý AI | Route Handler `app/api/assistant/chat` stream câu trả lời (proxy tới AI backend) | Khoá API chỉ ở server |
| Auth providers | Credentials (email) · Google · Facebook | FDD 1.1.2–1.1.4 |
| Băm mật khẩu | `bcrypt` / `argon2` | chỉ chạy ở Node runtime |
| Virtualization | `react-window` (hoặc `@tanstack/react-virtual`) | list > ~200 item |
| Test | **Jest** + `@testing-library/react` + `jest-dom` + `user-event` | cấu hình qua `next/jest` (hoặc `ts-jest` như slide); mock mạng bằng `msw` khi cần |
| E2E (tuỳ chọn) | Playwright | chỉ cho luồng sống còn: đăng nhập, đặt hàng |
| Đo lường | React DevTools Profiler, Lighthouse, `@next/bundle-analyzer`, `web-vitals` | `why-did-you-render` chỉ bật ở dev |
| Lint/format | ESLint + Prettier | |
| Deploy | Vercel | |

> **Không** dùng: React Router, `React.lazy` theo route (Next.js tự tách chunk theo route), `react-helmet` (dùng Metadata API), lưu token ở `localStorage`, `redux-saga` (ngoài phạm vi).

---

## 3. Cấu trúc thư mục theo chức năng FDD (BẮT BUỘC)

### 3.1 Nguyên tắc: 4 tầng, import một chiều

```
app/  ──►  components/layout  ──►  features/  ──►  entities/  ──►  shared (components/ui, hooks, lib, types, config)
(route)     (khung trang ghép)     (chức năng FDD)  (mô hình dữ liệu)  (hạ tầng dùng chung)
```

| Tầng | Chứa gì | Được import | Không được |
|---|---|---|---|
| `app/` | **Chỉ** route & file đặc biệt của Next.js (`page`, `layout`, `loading`, `error`, `route.ts`…). Page mỏng: lấy dữ liệu + ghép component | Mọi tầng | Viết UI phức tạp / logic nghiệp vụ ngay trong page |
| `components/layout/` | Header, Footer, sidebar tài khoản/admin: những khung **ghép nhiều feature** (chuông thông báo + badge giỏ hàng + menu user) | features, entities, shared | — |
| `features/<chức-năng>/` | Một thư mục = **một nhóm chức năng trong FDD**: UI, hook, Server Action, slice/store, schema riêng của chức năng đó | entities, shared; feature khác **chỉ qua `index.ts`** | Import sâu vào ruột feature khác (`@/features/cart/model/...`); import vòng |
| `entities/<thực-thể>/` | Type, zod schema, hàm gọi backend của **một thực thể** (product, order…), dùng chung cho cả phía khách lẫn admin | shared | features, app |
| shared | `components/ui`, `hooks`, `lib`, `types`, `config`: không biết gì về nghiệp vụ | shared | entities, features |

> ESLint chặn import sâu: `no-restricted-imports` với pattern `@/features/*/*` (chỉ cho `@/features/<tên>`).
> Lưu ý: ở Buổi 3 store đặt trong `src/app/`, nhưng trong Next.js `app/` là **thư mục route** → store chuyển sang `src/lib/`.

### 3.2 Cây thư mục

```
src/
├─ app/
│  ├─ layout.tsx · not-found.tsx · global-error.tsx · sitemap.ts · robots.ts
│  ├─ 403/page.tsx
│  │
│  ├─ (storefront)/                         # Khu khách hàng — layout: Header + Footer + nút mở Trợ lý AI
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                           # 2.1   Trang chủ
│  │  ├─ categories/[slug]/page.tsx         # 2.1   Danh mục theo ngành học / nhu cầu
│  │  ├─ search/page.tsx                    # 2.2   Tìm theo từ khoá, lọc, sắp xếp (?q=&brand=&min=&max=&sort=)
│  │  ├─ products/[slug]/
│  │  │  ├─ page.tsx                        # 2.3   Chi tiết SP (+ nút giỏ hàng 4.1.1, cảnh báo giá 6.1.1)
│  │  │  ├─ loading.tsx
│  │  │  └─ opengraph-image.tsx
│  │  ├─ assistant/
│  │  │  ├─ page.tsx                        # 3.1–3.3 Chat AI (khách dùng được)
│  │  │  ├─ history/page.tsx                # 3.4   Lịch sử hội thoại               🔒 user
│  │  │  └─ [conversationId]/page.tsx       # 3.4   Xem lại 1 hội thoại             🔒 user
│  │  ├─ cart/page.tsx                      # 4.1   Giỏ hàng
│  │  ├─ checkout/                          #                                        🔒 user
│  │  │  ├─ page.tsx                        # 4.2 + 5.1.1 Địa chỉ, mã giảm giá, phương thức thanh toán (?buyNow= cho "Mua ngay")
│  │  │  └─ result/page.tsx                 # 5.1.2 Kết quả thanh toán (returnUrl/cancelUrl của PayOS)
│  │  └─ account/                           #                                        🔒 user
│  │     ├─ layout.tsx                      # Menu tài khoản
│  │     ├─ profile/page.tsx                # 1.2.1 Thông tin cá nhân
│  │     ├─ addresses/page.tsx              # 1.2.2 Địa chỉ giao hàng
│  │     ├─ orders/page.tsx                 # 5.2.1–5.2.2 Danh sách + lọc trạng thái (?status=)
│  │     ├─ orders/[orderId]/page.tsx       # 5.2.3–5.2.5 Chi tiết, đánh giá, huỷ đơn
│  │     ├─ price-alerts/page.tsx           # 6.1.2–6.1.3 Danh sách / xoá cảnh báo giá
│  │     └─ notifications/page.tsx          # 6.2   Thông báo đơn hàng & thanh toán
│  │
│  ├─ (auth)/                               # Layout tối giản, không Header; đã đăng nhập → redirect
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx                     # 1.1.2–1.1.4 Email, Google, Facebook
│  │  ├─ register/page.tsx                  # 1.1.1
│  │  ├─ forgot-password/page.tsx           # 1.1.5 Gửi email đặt lại
│  │  └─ reset-password/page.tsx            # 1.1.5 Đặt mật khẩu mới (?token=)
│  │
│  ├─ admin/                                # Khu quản trị — layout: AdminSidebar      🔒 admin
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                           # 8.1   Thống kê cửa hàng
│  │  ├─ categories/  page · new/page · [id]/page   # 7.1
│  │  ├─ products/    page · new/page · [id]/page   # 7.2 (+ tồn kho)
│  │  ├─ orders/      page · [id]/page              # 8.2.1–8.2.3, 8.2.6 Đơn hàng, cập nhật trạng thái, xác nhận COD
│  │  ├─ transactions/ page · [id]/page             # 8.2.4–8.2.5 Giao dịch
│  │  ├─ coupons/     page · new/page · [id]/page   # 8.3
│  │  └─ users/       page · [id]/page              # 8.4   Đổi role, đổi trạng thái tài khoản
│  │
│  └─ api/
│     ├─ auth/[...nextauth]/route.ts        # 1.1   Auth.js
│     └─ assistant/chat/route.ts            # 3.1   Proxy streaming tới AI backend (giữ khoá API ở server)
│
├─ features/                                # ⇄ 8 nhánh FDD
│  ├─ auth/                 # 1.1  LoginForm, RegisterForm, SocialLoginButtons (Google/Facebook),
│  │                        #      ForgotPasswordForm, ResetPasswordForm, LogoutButton · actions.ts · schemas.ts
│  ├─ profile/              # 1.2.1 ProfileForm, AvatarUpload, ShoppingPreferences · actions.ts
│  ├─ addresses/            # 1.2.2 AddressList, AddressForm, AddressPicker (dùng lại ở checkout) · actions.ts
│  ├─ catalog/              # 2    HomeSections, CategoryGrid, ProductGrid, ProductCard, SearchBar,
│  │                        #      FilterPanel (thương hiệu/giá/thông số), SortSelect, ProductGallery, SpecTable
│  │                        #      hooks/useProductFilters.ts — đồng bộ bộ lọc ⇄ URL searchParams
│  ├─ reviews/              # 2.3 (xem) + 5.2.4 (viết) ReviewList, RatingSummary, ReviewForm · actions.ts
│  ├─ assistant/            # 3    ChatPanel, MessageList, PromptInput, QuickQuestions, SuggestedProductCard,
│  │                        #      SaveConversationDialog, ConversationHistoryList
│  │                        #      model/useAssistantStore.ts (Zustand + persist sessionStorage) · actions.ts (claimConversation)
│  ├─ cart/                 # 4.1  model/cartSlice.ts, model/selectors.ts, AddToCartButton, BuyNowButton,
│  │                        #      CartItemRow, CartSummary · cart.sync.ts (gộp giỏ khách khi đăng nhập)
│  ├─ checkout/             # 4.2 + 5.1 CheckoutForm, CouponInput, PaymentMethodSelect (COD | PayOS/VietQR),
│  │                        #      OrderSummary, PaymentResult · actions.ts (applyCoupon, placeOrder) · pricing.ts
│  ├─ orders/               # 5.2  OrderList, OrderStatusFilter, OrderDetail, OrderTimeline, CancelOrderButton
│  │                        #      · actions.ts · order.rules.ts (canCancel)
│  ├─ price-alerts/         # 6.1  PriceAlertButton (ở trang SP), PriceAlertForm, PriceAlertList · api/ (RTK Query)
│  ├─ notifications/        # 6.2  NotificationBell, NotificationList, NotificationItem · api/ (polling, markAsRead)
│  └─ admin/                # 7 + 8 — CHỈ dùng trong app/admin
│     ├─ dashboard/         # 8.1  StatCards, RevenueChart (next/dynamic), TopProducts, LowStockTable
│     ├─ categories/        # 7.1  CategoryTable, CategoryForm (gắn thẻ ngành học / mục đích sử dụng)
│     ├─ products/          # 7.2  ProductTable, ProductForm, SpecEditor, StockInput, ImageUploader
│     ├─ orders/            # 8.2  AdminOrderTable, OrderStatusUpdater, ConfirmCodButton
│     ├─ transactions/      # 8.2  TransactionTable, TransactionDetail
│     ├─ coupons/           # 8.3  CouponTable, CouponForm
│     └─ users/             # 8.4  UserTable, UserDetail, RoleSelect, AccountStatusToggle
│
├─ entities/                # Mỗi thực thể: types.ts · schemas.ts (zod) · service.ts ('server-only', gọi backend) · index.ts
│  ├─ user/ · address/ · category/ · product/ · review/
│  ├─ order/ · transaction/ · coupon/
│  └─ price-alert/ · notification/ · conversation/
│
├─ components/
│  ├─ ui/                   # Button, Input, Select, Modal, Drawer, Tabs, Accordion, DataTable, Pagination,
│  │                        # Badge, Skeleton, EmptyState, ConfirmDialog… (không biết nghiệp vụ)
│  ├─ layout/               # StorefrontHeader, Footer, UserMenu, AssistantLauncher, AccountSidebar, AdminSidebar
│  └─ providers/            # StoreProvider (makeStore), SessionProvider, ThemeProvider, AppProviders
├─ hooks/                   # useDebounce, usePagination<T>, useMediaQuery
├─ lib/
│  ├─ api/http.ts           # fetch phía server: baseURL từ env, gắn token phiên, chuẩn hoá ApiResponse<T> & lỗi
│  ├─ api/baseApi.ts        # RTK Query createApi + tagTypes; feature dùng injectEndpoints
│  ├─ store.ts · hooks.ts   # makeStore, RootState, AppDispatch · useAppDispatch, useAppSelector
│  ├─ auth/guards.ts        # requireUser(), requirePermission(action) — dùng trong page & Server Action
│  ├─ permissions.ts        # Role, Action, can()
│  ├─ format.ts             # formatVND, formatDate
│  └─ test-utils.tsx        # renderWithProviders, factories (makeProduct, makeOrder…)
├─ types/                   # api.ts (ApiResponse<T>, Paginated<T>, AsyncStatus) · next-auth.d.ts · env.d.ts
├─ config/                  # site.ts (tên, metadata mặc định, menu) · routes.ts (hằng số đường dẫn)
├─ auth.ts · auth.config.ts
└─ middleware.ts            # (hoặc proxy.ts tuỳ version Next.js)
```

**Vì sao `admin/` không nằm trong route group:** URL cần có tiền tố `/admin`. Còn `(storefront)` và `(auth)` là route group, chỉ dùng để tách layout và **không** xuất hiện trong URL.

### 3.3 Ánh xạ FDD → route → feature → quyền

| FDD | Chức năng | Route | Feature | Quyền |
|---|---|---|---|---|
| 1.1.1 | Đăng ký bằng email | `/register` | `auth` | guest |
| 1.1.2–1.1.4 | Đăng nhập email / Google / Facebook | `/login` | `auth` | guest |
| 1.1.5 | Đặt lại mật khẩu | `/forgot-password`, `/reset-password` | `auth` | guest |
| 1.1.6 | Đăng xuất | `UserMenu` (Server Action) | `auth` | user |
| 1.1.7 | Mở khoá sinh trắc học | — | — | *ngoài phạm vi web* |
| 1.2.1 | Cập nhật thông tin cá nhân | `/account/profile` | `profile` | user |
| 1.2.2 | Địa chỉ giao hàng, đặt mặc định | `/account/addresses` | `addresses` | user |
| 2.1 | Trang chủ, danh mục | `/`, `/categories/[slug]` | `catalog` | guest |
| 2.2 | Tìm, lọc, sắp xếp | `/search` | `catalog` | guest |
| 2.3 | Chi tiết sản phẩm, đánh giá | `/products/[slug]` | `catalog`, `reviews` | guest |
| 3.1–3.2 | Chat theo mục đích/ngân sách, xem SP gợi ý | `/assistant` (+ launcher nổi) | `assistant` | guest |
| 3.3 | Giữ hội thoại theo phiên, gắn vào tài khoản khi đăng nhập | `/assistant` | `assistant` | guest → user |
| 3.4 | Lịch sử hội thoại | `/assistant/history`, `/assistant/[id]` | `assistant` | user |
| 4.1.1 | Thêm vào giỏ / Mua ngay | `/products/[slug]`, `/cart` | `cart` | guest (giỏ tạm) |
| 4.1.2 | Sửa / xoá SP trong giỏ | `/cart` | `cart` | guest |
| 4.2.1–4.2.3 | Chọn địa chỉ, mã giảm giá, phương thức thanh toán | `/checkout` | `checkout`, `addresses` | user |
| 5.1.1 | Thanh toán COD / PayOS-VietQR | `/checkout` | `checkout` | user |
| 5.1.2 | Kết quả thanh toán | `/checkout/result` | `checkout` | user |
| 5.2.1–5.2.3 | DS đơn, lọc trạng thái, chi tiết | `/account/orders[/id]` | `orders` | user (đơn của mình) |
| 5.2.4 | Đánh giá SP đã mua | `/account/orders/[id]` | `reviews` | user |
| 5.2.5 | Huỷ đơn khi đủ điều kiện | `/account/orders/[id]` | `orders` | user |
| 6.1.1 | Tạo cảnh báo giá mục tiêu | `/products/[slug]` | `price-alerts` | user |
| 6.1.2–6.1.3 | DS / xoá cảnh báo giá | `/account/price-alerts` | `price-alerts` | user |
| 6.1.4 | Gửi thông báo khi giá chạm mục tiêu | *(backend job)* → hiện ở 6.2 | `notifications` | — |
| 6.2.1–6.2.2 | DS thông báo, mở đơn/SP, đánh dấu đã đọc | Header bell, `/account/notifications` | `notifications` | user |
| 7.1 | Quản lý danh mục | `/admin/categories` | `admin/categories` | admin |
| 7.2 | Quản lý sản phẩm & tồn kho | `/admin/products` | `admin/products` | admin |
| 8.1 | Thống kê doanh thu, số lượng bán, tồn kho | `/admin` | `admin/dashboard` | admin |
| 8.2.1–8.2.3 | Đơn hàng: DS, chi tiết, cập nhật trạng thái | `/admin/orders` | `admin/orders` | admin |
| 8.2.4–8.2.5 | Giao dịch: DS, chi tiết | `/admin/transactions` | `admin/transactions` | admin |
| 8.2.6 | Xác nhận đã thu tiền COD | `/admin/orders/[id]` | `admin/orders` | admin |
| 8.3 | Mã giảm giá | `/admin/coupons` | `admin/coupons` | admin |
| 8.4 | Người dùng: DS, chi tiết, đổi role, đổi trạng thái | `/admin/users` | `admin/users` | admin |

### 3.4 Khuôn mẫu bên trong một feature

```
features/<tên>/
├─ components/        # UI của chức năng (Client Component đặt 'use client' ở từng file lá)
├─ hooks/             # hook riêng của chức năng
├─ api/               # RTK Query: baseApi.injectEndpoints({...}) — chỉ khi cần fetch phía client
├─ model/             # slice.ts / selectors.ts (Redux) hoặc use<Tên>Store.ts (Zustand)
├─ actions.ts         # Server Actions ('use server') — luôn qua requirePermission() + zod
├─ schemas.ts         # zod riêng của form (schema thực thể dùng chung → entities/)
├─ types.ts           # type riêng của chức năng (type thực thể → entities/)
├─ *.rules.ts / utils # logic thuần (pricing, canCancel…) — ưu tiên test kỹ
├─ index.ts           # PUBLIC API: chỉ export những gì nơi khác được dùng
└─ *.test.ts(x)       # đặt cạnh file nguồn
```
Feature nhỏ (≤ 4 file) thì để phẳng, chưa cần chia thư mục con. Khi file thứ 5 xuất hiện thì mới tách theo khuôn trên.

**Ai ghép các feature với nhau?** Page trong `app/` và `components/layout/`. Ví dụ `app/(storefront)/products/[slug]/page.tsx` ghép `catalog` (thông tin SP) + `reviews` (đánh giá) + `cart` (`AddToCartButton`) + `price-alerts` (`PriceAlertButton`). Feature `catalog` **không** import `cart`.

### 3.5 Quy ước đặt tên
- Thư mục route & feature: `kebab-case` tiếng Anh (`price-alerts`, `forgot-password`). Component: `PascalCase.tsx`. Hook: `useXxx.ts`. Slice: `<feature>Slice.ts`. Zustand: `use<Feature>Store.ts`. Server Action: động từ (`placeOrder`, `cancelOrder`, `confirmCodPayment`).
- Comment mã FDD ở đầu page/feature (`// FDD 5.2.5 — Huỷ đơn hàng`) để truy vết yêu cầu khi review.
- Test đặt **cạnh** file nguồn: `xxx.test.ts(x)`.
- Import tuyệt đối qua alias `@/`. Đường dẫn route lấy từ `config/routes.ts`, không hard-code chuỗi `'/account/orders'` rải rác.

---

## 4. TypeScript — chuẩn viết type (Buổi 1)

### 4.1 Cấu hình
```jsonc
// tsconfig.json (trích)
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true } }
```
```jsonc
// .eslintrc (trích)
{ "rules": { "@typescript-eslint/no-explicit-any": "error",
             "@typescript-eslint/consistent-type-imports": "warn" } }
```

### 4.2 Type dùng chung (BẮT BUỘC dùng, không tự viết lại)
```ts
// src/types/api.ts
export interface ApiResponse<T> { statusCode: number; message: string; data: T }
export interface Paginated<T>   { items: T[]; page: number; total: number }
export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export interface HasId { id: string }
```

### 4.3 Quy tắc
| Tình huống | Cách làm đúng | Đừng làm |
|---|---|---|
| Wrapper API giống nhau cho nhiều entity | `ApiResponse<Paginated<Product>>` | Viết `{ data: Product[]; total }` lặp lại |
| Hàm/Repository dùng cho nhiều entity | Generic có constraint: `<T extends HasId>` | `any` hoặc copy-paste |
| DTO form cập nhật / xem trước | `Partial<Product>`, `Pick<User,'name'\|'email'>`, `Omit<Product,'id'>` | Khai báo interface mới gần giống hệt |
| Bảng tra (map) | `Record<Role, Action[]>` | `{ [key: string]: any }` |
| Trạng thái / biến thể | **Union literal** & **discriminated union** (`role: 'admin' \| 'user'`, `status: AsyncStatus`) | `string` |
| Thu hẹp kiểu | Custom type guard `function isAdmin(u): u is AdminUser` | Ép kiểu `as` bừa bãi |
| Helper type nâng cao | Mapped type (`Nullable<T>`), conditional type + `infer` khi thật sự cần | Lạm dụng type "ma thuật" khó đọc |
| Thư viện JS không có type | Khai báo trong `src/types/*.d.ts` (`declare module '...'`) | `// @ts-ignore` |
| Mở rộng type thư viện (Auth.js) | Module augmentation trong `types/next-auth.d.ts` | Ép kiểu `session.user as any` |

> `as` chỉ được phép ở biên dữ liệu (kết quả `res.json()`), và **NÊN** validate bằng `zod` thay vì tin tưởng mù quáng.
> Decorator (Buổi 1) dành cho NestJS ở phía backend — **không dùng trong frontend**.

---

## 5. Chiến lược render từng trang (Buổi 7)

**Nguyên tắc chọn:** SSG → ISR → SSR → CSR (từ nhanh/rẻ đến linh hoạt). Chỉ đi xuống mức sau khi mức trước không đáp ứng được.

| Route | FDD | Chiến lược | Cấu hình | Lý do |
|-------|-----|-----------|----------|-------|
| `/` | 2.1 | **ISR** | `revalidate = 300` | Sản phẩm nổi bật, khuyến mãi đổi định kỳ; cần SEO |
| `/categories/[slug]` | 2.1 | **SSG + ISR** | `generateStaticParams` + `revalidate = 300` | Trang đích SEO theo ngành học / nhu cầu |
| `/products/[slug]` | 2.3 | **SSG + ISR** | `generateStaticParams` (SP phổ biến) + `revalidate = 60` + `revalidatePath` khi admin sửa | SEO quan trọng; giá/tồn kho đổi định kỳ. Khối đánh giá bọc `<Suspense>` (streaming) |
| `/search` | 2.2 | **SSR** | đọc `searchParams` (tự dynamic); `noindex`; canonical về `/search` | Phụ thuộc từ khoá & bộ lọc từng request |
| `/assistant` | 3.1–3.3 | **CSR** | Client Component, stream từ `/api/assistant/chat` | Tương tác liên tục, không cần SEO |
| `/assistant/history`, `/assistant/[id]` | 3.4 | **SSR** | `auth()` | Dữ liệu riêng của người dùng |
| `/cart` | 4.1 | **CSR** | đọc Redux store | Giỏ tạm của khách nằm ở client |
| `/checkout` | 4.2, 5.1.1 | **SSR** + Client form | `auth()`; địa chỉ & giỏ lấy từ server | Cá nhân hoá, phải tính lại giá ở server |
| `/checkout/result` | 5.1.2 | **SSR** | đọc `orderCode` từ query, **hỏi backend trạng thái thật** | Không tin `?status=PAID` trên URL |
| `/account/*` | 1.2, 5.2, 6 | **SSR** | `auth()` (dùng cookies → tự dynamic) | Cá nhân hoá |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | 1.1 | **SSG** (form là Client Component) | đã đăng nhập → `redirect` | Trang tĩnh |
| `/admin/*` | 7, 8 | **SSR** | `requirePermission('admin:access')` | Cá nhân hoá + phân quyền |

> ISR có thể hiển thị giá cũ tối đa N giây. Vì vậy **giá trong đơn hàng luôn được tính lại ở server** khi `placeOrder`, không lấy giá client gửi lên.

**Lưu ý Next.js 15 (kiểm lại theo version đã chốt):**
- `fetch` **mặc định KHÔNG cache** → muốn SSG/ISR phải ghi rõ `cache: 'force-cache'` hoặc `next: { revalidate }`.
- `params` / `searchParams` là **Promise** → `const { slug } = await params;`.
- Sau `npm run build`, đọc bảng kết quả: `○ Static`, `● SSG`, `ƒ Dynamic` — **PR nào đổi chiến lược render phải dán bảng build vào mô tả PR.**

```tsx
// app/(storefront)/products/[slug]/page.tsx — FDD 2.3 — mẫu chuẩn
type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await productService.listPopular();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);
  if (!product) notFound();
  return (
    <>
      <ProductDetail product={product} />                 {/* catalog */}
      <AddToCartButton productId={product.id} />          {/* cart */}
      <PriceAlertButton productId={product.id} price={product.price} /> {/* price-alerts */}
      <Suspense fallback={<ReviewSkeleton />}>
        <ReviewList productId={product.id} />             {/* reviews */}
      </Suspense>
    </>
  );
}
```

---

## 6. Server Component vs Client Component (Buổi 7)

| Cần gì | Dùng |
|---|---|
| Hiển thị dữ liệu, nội dung cần SEO, gọi DB/API có khoá bí mật | **Server Component** (mặc định) — `async` + `await` trực tiếp, **không** `useEffect` |
| `useState`, `useEffect`, `onClick`, `window`, `localStorage`, Redux/Zustand hook | **Client Component** (`'use client'`) |

**Quy tắc:**
- `'use client'` đặt ở **lá**: `SearchBar`, `FilterPanel`, `AddToCartButton`, `PriceAlertButton`, `ChatPanel`... Trang và danh sách vẫn là Server Component.
- Muốn giữ phần lớn cây ở server khi bọc bởi Client Component → **truyền Server Component qua `children`**.
- Loading/error của trang: dùng `loading.tsx` / `error.tsx`; phần chậm trong trang bọc `<Suspense fallback>` để **streaming**.
- Điều hướng: `<Link>` (tự prefetch). `useRouter`/`usePathname` chỉ trong Client Component; ở server dùng `redirect()` / `notFound()`.
- File chứa code chỉ được chạy ở server (DB, secret) → `import 'server-only'` ở đầu file.

**Chống hydration mismatch:** không render `Date.now()`, `Math.random()`, `window.*` trong lần render đầu của component có SSR. Cần thì đưa vào `useEffect` hoặc `next/dynamic` với `ssr: false`.

---

## 7. Quản lý state (Buổi 3, 4)

### 7.1 Ma trận quyết định — đặt state ở đâu?

| Loại state | Ví dụ (FDD) | Đặt ở |
|---|---|---|
| Dữ liệu từ server (đọc) | danh mục, chi tiết SP, đơn hàng, bảng admin (2, 5.2, 7, 8) | **Server Component** (ưu tiên số 1) |
| Bộ lọc / sắp xếp / phân trang | từ khoá, thương hiệu, khoảng giá, thông số, trạng thái đơn (2.2, 5.2.2) | **URL `searchParams`** — nguồn sự thật duy nhất, chia sẻ link được (`useProductFilters`) |
| Dữ liệu server cần refetch phía client | thông báo + badge chưa đọc (6.2), cảnh báo giá (6.1) | **RTK Query** (`baseApi.injectEndpoints`, polling 30s cho thông báo) |
| State nghiệp vụ toàn cục, nhiều nơi đọc/ghi | **giỏ hàng** (4.1) — khách lưu localStorage, đăng nhập thì gộp lên server | **Redux Toolkit slice** |
| Hội thoại AI đang chat | tin nhắn, `conversationId`, trạng thái stream (3.1–3.3) | **Zustand** `useAssistantStore` + `persist` (sessionStorage) |
| State UI phụ, đơn giản | mở/đóng launcher AI, drawer, modal | **Zustand** (store riêng từng mục đích) / `useState` |
| State toàn cục ít thay đổi | theme, ngôn ngữ | **Context** (tách nhỏ + `useMemo`) |
| State chỉ 1 component cần | input đang gõ, hover | `useState` local — **không** đẩy lên store |
| Phiên đăng nhập | user, role | `auth()` (server) / `useSession()` (client) — **không** copy vào Redux |

> Không có công cụ "thắng tuyệt đối". Dùng **song song** nhiều công cụ là bình thường, miễn đúng loại state.

### 7.2 Redux Toolkit — chuẩn bắt buộc
```ts
// src/lib/store.ts
export const makeStore = () =>
  configureStore({
    reducer: { cart: cartReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => {
      const base = getDefault().concat(baseApi.middleware);
      return process.env.NODE_ENV === 'development' ? base.concat(logger) : base; // logger CHỈ ở dev
    },
  });
export type AppStore    = ReturnType<typeof makeStore>;
export type RootState   = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
```
```ts
// src/lib/hooks.ts — component CHỈ import 2 hook này
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
// (tương đương TypedUseSelectorHook<RootState> trong slide)
```
```tsx
// src/components/providers/StoreProvider.tsx
'use client';
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<AppStore | null>(null);
  if (!ref.current) ref.current = makeStore();   // mỗi request/phiên 1 store — KHÔNG singleton
  return <Provider store={ref.current}>{children}</Provider>;
}
```

**Quy tắc:**
- Mỗi miền nghiệp vụ một slice (`cart`, `products`...). **Không** gộp toàn bộ app vào 1 slice.
- State interface rõ ràng; action có `PayloadAction<T>`; async có `status: AsyncStatus` + `error`.
- `createAsyncThunk<Return, Arg>` khi có logic nghiệp vụ phức tạp; còn CRUD thuần → **RTK Query**.
- Selector **nhỏ, đúng phần cần**: `useAppSelector((s) => s.cart.items)`, không lấy cả `s.cart` rồi destructure. Dữ liệu dẫn xuất (tổng tiền, số lượng) → `createSelector`.
- Redux DevTools phải xem được lịch sử action khi thao tác giỏ hàng (tiêu chí chấm).

### 7.3 Zustand
- Khai báo kiểu qua `create<State>()`; state + action chung 1 object; async là hàm `async` tự `set({ status })`.
- **Luôn dùng selector**: `useAssistantStore((s) => s.messages)` — không gọi `useAssistantStore()` lấy cả store.
- Mỗi mục đích một store (`useAssistantStore`, `useUiStore`), **không** gộp với cart.
- Hội thoại của khách: `persist` với `createJSONStorage(() => sessionStorage)` (FDD 3.3: theo phiên trình duyệt). Khi đã đăng nhập & người dùng đồng ý lưu → gọi Server Action `claimConversation(conversationId)` rồi xoá bản tạm.

### 7.4 Context
- Tách theo loại dữ liệu (`ThemeContext`, `LocaleContext`), **không** có `AppContext` tổng.
- `value` của Provider **bắt buộc** bọc `useMemo`.
- Hook truy cập phải throw khi dùng ngoài Provider:
```ts
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
```

---

## 8. Design pattern cho component (Buổi 2)

| Tình huống | Pattern | Ví dụ trong dự án |
|---|---|---|
| Chia sẻ **logic** không kèm UI | **Custom Hook** (ưu tiên mặc định) | `useDebounce`, `usePagination<T>`, `useFetch<T>` |
| Nhóm nhiều component nhỏ phối hợp thành 1 khối UI | **Compound Component** + Context | `Tabs`, `Accordion`, `Menu` trong `components/ui` |
| Nơi gọi cần toàn quyền quyết định UI | Render Props | hiếm khi cần |
| Bọc nhiều component bằng cùng 1 logic | HOC (generic `<P extends object>`) | hạn chế; **auth đã xử lý ở server/middleware — không viết `withAuth` phía client** |

**Chuẩn custom hook:**
- Tên bắt đầu `use`, **một trách nhiệm**, trả về **object có tên rõ ràng + type đầy đủ** (`{ data, loading, error }`).
- **Không biết gì về UI** (không trả JSX, không hard-code text hiển thị).
- Generic khi dữ liệu thay đổi: `usePagination<T>(items: T[], perPage: number)` → `{ page, totalPages, pageItems, next, prev, goToPage }`.
- Test được độc lập bằng `renderHook`.

**Chuẩn compound component:** API dạng `<Tabs><Tabs.List><Tabs.Tab value=…/></Tabs.List><Tabs.Panel value=…/></Tabs>`; Context nội bộ có guard throw; không làm "wrapper hell".

---

## 9. Hiệu năng (Buổi 5)

### 9.1 Quy trình
**Đo → xác định nguyên nhân → sửa đúng kỹ thuật → đo lại → ghi số liệu vào PR.**
Công cụ: React DevTools Profiler (*Highlight updates*, *Why did this render?*), Lighthouse, `@next/bundle-analyzer`, `web-vitals` (production).

### 9.2 Bảng kỹ thuật
| Vấn đề phát hiện | Kỹ thuật | Lưu ý |
|---|---|---|
| Component con render thừa dù props không đổi | `React.memo` | **Đi cặp** `useCallback` cho prop hàm, nếu không memo vô tác dụng |
| Tính toán nặng chạy lại mỗi render (lọc/sort list lớn) | `useMemo` | Không dùng cho phép tính rẻ |
| Truyền handler xuống con đã memo | `useCallback` | deps đầy đủ |
| Ô tìm kiếm gọi API/lọc liên tục | `useDebounce` 300ms | scroll/resize → throttle |
| List hàng trăm/nghìn phần tử | **Virtualization** (`react-window`) | > ~200 item là cân nhắc |
| Component client nặng (chart, editor) | `next/dynamic` (`ssr: false`, có `loading`) | |
| Script bên thứ ba | `next/script` `strategy="lazyOnload"` | |
| Ảnh | **`next/image`** có `width/height`, `alt` | **Cấm** `<img>` trần (trừ lý do chính đáng) |
| Font | **`next/font`** (subsets `latin`, `vietnamese`) | |
| Bundle to | bundle analyzer; import đúng phần (`lodash/debounce`, không `import _ from 'lodash'`) | |
| Selector Redux kéo re-render | selector nhỏ, `createSelector` | |

### 9.3 Best practice bắt buộc
- `key` = id ổn định (`product.id`), **cấm** `key={index}` cho list có thêm/xoá/sắp xếp.
- Không tạo object/array/hàm inline làm prop cho component đã memo (`style={{…}}`, `onAdd={() => …}`) → hằng số ngoài component hoặc `useMemo/useCallback`.
- Ưu tiên Server Component để giảm JS phía client (cải thiện INP).

### 9.4 Ngân sách hiệu năng (đo trên production)
| Chỉ số | Ngưỡng |
|---|---|
| Lighthouse Performance (trang công khai) | ≥ 90 |
| Lighthouse SEO (trang công khai) | ≥ 95 |
| LCP | ≤ 2,5 s |
| CLS | ≤ 0,1 |
| INP | ≤ 200 ms |

---

## 10. Xác thực, phân quyền & bảo mật (Buổi 8)

### 10.1 Auth.js
- `auth.ts` xuất `handlers, auth, signIn, signOut`; providers: **Credentials** (email/mật khẩu — `authorize` gọi backend xác thực, trả user hoặc `null`) + **Google** + **Facebook** (FDD 1.1.2–1.1.4). Đăng ký (1.1.1) và quên/đặt lại mật khẩu (1.1.5) là Server Action gọi API backend, không qua provider.
- `session: { strategy: 'jwt' }` (bắt buộc với Credentials).
- `callbacks.jwt` gắn `id`, `role` vào token **chỉ khi `user` có mặt** (lúc đăng nhập); `callbacks.session` đưa `id`, `role` ra `session.user`. **Không** nhét dữ liệu nhạy cảm vào token.
- `types/next-auth.d.ts`: augmentation `User.{role, status}`, `Session.user.{id, role, status}`, `JWT.{id, role, status}` với `type Role = 'admin' | 'user'`, `type AccountStatus = 'active' | 'locked'`.
- Callback `signIn`: trả `false` nếu tài khoản `locked` (FDD 8.4.4). Callback URL OAuth khai báo cho cả Google lẫn Facebook: `/api/auth/callback/google`, `/api/auth/callback/facebook`.
- Đăng nhập/đăng xuất bằng **Server Action** trong `<form action>`.
- Đọc phiên: **ưu tiên `await auth()` ở server**; `useSession()` chỉ khi UI client thật sự cần (bọc `SessionProvider`).
- Middleware chạy Edge → tách `auth.config.ts` (nhẹ, không bcrypt/DB) dùng cho middleware; `auth.ts` đầy đủ dùng ở server.

### 10.2 Phân quyền RBAC — một nguồn sự thật duy nhất
```ts
// src/lib/permissions.ts
export type Role = 'guest' | 'user' | 'admin';
export type Action =
  // Khách
  | 'catalog:read' | 'assistant:chat' | 'cart:manage'
  // Người dùng
  | 'profile:manage' | 'assistant:history' | 'order:create' | 'order:own'
  | 'review:create' | 'price-alert:manage' | 'notification:read'
  // Quản trị
  | 'admin:access' | 'stats:read' | 'category:manage' | 'product:manage'
  | 'order:manage' | 'transaction:read' | 'payment:confirm-cod'
  | 'coupon:manage' | 'user:manage';

const guestActions: Action[] = ['catalog:read', 'assistant:chat', 'cart:manage'];
const userActions: Action[] = [
  ...guestActions, 'profile:manage', 'assistant:history', 'order:create',
  'order:own', 'review:create', 'price-alert:manage', 'notification:read',
];
const permissions: Record<Role, Action[]> = {
  guest: guestActions,
  user: userActions,
  admin: [
    ...userActions, 'admin:access', 'stats:read', 'category:manage', 'product:manage',
    'order:manage', 'transaction:read', 'payment:confirm-cod', 'coupon:manage', 'user:manage',
  ],
};
export const can = (role: Role, action: Action) => permissions[role].includes(action);
```
```ts
// src/lib/auth/guards.ts — dùng trong page (Server Component) và Server Action
export async function requirePermission(action: Action) {
  const session = await auth();
  if (!session) redirect('/login');                       // 401
  if (session.user.status === 'locked') redirect('/login?error=locked');
  if (!can(session.user.role, action)) redirect('/403');  // 403
  return session;
}
```
**Mọi nơi** (middleware, page, Server Action, UI ẩn/hiện nút) đều gọi `can()` / `requirePermission()`. Đổi chính sách thì chỉ sửa đúng file này.

| Hành động (FDD) \ Vai trò | guest | user | admin |
|---|:-:|:-:|:-:|
| Xem / tìm sản phẩm (2) | ✓ | ✓ | ✓ |
| Chat với trợ lý AI (3.1–3.3) | ✓ | ✓ | ✓ |
| Giỏ hàng (4.1) | ✓ *(tạm)* | ✓ | ✓ |
| Hồ sơ, địa chỉ (1.2), lịch sử chat (3.4) | ✕ | ✓ | ✓ |
| Đặt hàng, thanh toán (4.2, 5.1) | ✕ | ✓ | ✓ |
| Xem/huỷ đơn của mình, đánh giá (5.2) | ✕ | ✓ | ✓ |
| Cảnh báo giá, thông báo (6) | ✕ | ✓ | ✓ |
| Danh mục, sản phẩm, tồn kho (7) | ✕ | ✕ | ✓ |
| Thống kê, đơn hàng, giao dịch, xác nhận COD, mã giảm giá, người dùng (8) | ✕ | ✕ | ✓ |

**Trạng thái tài khoản (8.4.4):** tài khoản `locked` bị chặn ngay ở callback `signIn` của Auth.js và bị chặn lại trong `requirePermission()` (phòng trường hợp bị khoá khi đang có phiên). Đưa `status` vào JWT/Session giống `role`.

### 10.3 Bốn lớp bảo vệ (BẮT BUỘC đủ cả 4)
| Lớp | Việc phải làm |
|---|---|
| 1. **Middleware** | `matcher: ['/account/:path*', '/checkout/:path*', '/assistant/:path+', '/admin/:path*']` (`/assistant` gốc vẫn công khai cho khách); chưa đăng nhập → `/login`; sai vai trò → `/403`. Chỉ kiểm tra **nhẹ**, không query DB. |
| 2. **Page (Server Component)** | `auth()` **trước khi lấy dữ liệu**; không có phiên → `redirect('/login')`; thiếu quyền → `redirect('/403')`. Kiểm tra trong **từng page**, không chỉ ở layout (layout không render lại khi chuyển trang con). |
| 3. **Server Action / Route Handler** | Server Action là **endpoint công khai**: luôn `auth()` + `can()` + `zod.parse()` đầu vào. |
| 4. **Tầng dữ liệu** | Truy vấn luôn lọc theo `session.user.id`; **không tin** `userId` gửi từ client. |

```ts
// features/admin/products/actions.ts — FDD 7.2 — mẫu chuẩn Server Action
'use server';
const Schema = z.object({ id: z.string().min(1) });

export async function deleteProduct(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('UNAUTHENTICATED');
  if (!can(session.user.role, 'product:manage')) throw new Error('FORBIDDEN');
  const { id } = Schema.parse({ id: formData.get('id') });
  await db.product.delete({ where: { id } });
  revalidatePath('/products');
}
```

### 10.4 Checklist bảo mật
- [ ] Token/phiên chỉ trong **cookie httpOnly, Secure, SameSite** (Auth.js lo). **Cấm** lưu token ở `localStorage`.
- [ ] Secret **không** có tiền tố `NEXT_PUBLIC_`; file server dùng `import 'server-only'`.
- [ ] `.env.local` trong `.gitignore`; commit `.env.example` (chỉ tên biến, không giá trị).
- [ ] Callback URL OAuth khai báo đúng cho cả localhost và domain production.
- [ ] Không dùng GET để thay đổi dữ liệu.
- [ ] Hạn chế `dangerouslySetInnerHTML` — chỉ cho JSON-LD và phải escape `<` → `<`.
- [ ] Thêm header bảo mật (CSP, `X-Frame-Options`) qua middleware hoặc `next.config`.
- [ ] Không ghi log mật khẩu / token.
- [ ] Theo dõi thông báo bảo mật của Next.js (đã có lỗ hổng bypass middleware năm 2025) → càng thấy rõ vì sao cần đủ 4 lớp.

---

## 11. SEO (Buổi 7, 8)

| Hạng mục | Yêu cầu |
|---|---|
| Root layout | `metadataBase`, `title: { default: 'NexTech', template: '%s \| NexTech' }` |
| Trang tĩnh | `export const metadata: Metadata = {...}` |
| Trang chi tiết | `generateMetadata` lấy title/description/`openGraph.images` từ dữ liệu thật |
| Canonical | `alternates.canonical` cho trang có query (`?sort=`, `?utm_`) |
| Đa ngôn ngữ (nếu làm) | `alternates.languages` → hreflang |
| Trang riêng tư & kết quả tìm kiếm | `robots: { index: false, follow: false }` (`/account`, `/admin`, `/cart`, `/checkout`, `/assistant`, `/search`) |
| Ảnh chia sẻ | `opengraph-image.tsx` (1200×630, `ImageResponse`) cho `/products/[slug]` và `/categories/[slug]` |
| Structured data | JSON-LD `Product` + `Offer` (trang SP), `BreadcrumbList` (trang con), `Organization` (trang chủ) |
| Sitemap / robots | `app/sitemap.ts` sinh từ dữ liệu, `app/robots.ts` |
| Kiểm tra | View page source / `curl`, Rich Results Test, Lighthouse, PageSpeed Insights |

---

## 12. Kiểm thử (Buổi 6)

### 12.1 Chiến lược
Kim tự tháp: **nhiều unit** (hàm, reducer, hook, `can()`) → **vừa đủ integration** (component + store + API mock) → **ít E2E** (đăng nhập, đặt hàng).

### 12.2 Phân công module test (tối thiểu)
| Module (FDD) | Bắt buộc test |
|---|---|
| **cart** (4.1) | `cartSlice` (add / remove / updateQuantity / Mua ngay + biên: id không tồn tại, thêm trùng, vượt tồn kho), selectors tổng tiền, gộp giỏ khách khi đăng nhập, `CartSummary` |
| **checkout** (4.2, 5.1) | `pricing.ts` (tạm tính, mã giảm giá %/cố định, hết hạn, đơn tối thiểu), `CouponInput` báo lỗi, `PaymentMethodSelect`, trang kết quả với 3 trạng thái (thành công / thất bại / huỷ) |
| **auth & phân quyền** (1.1, 8.4) | `can()` đủ ma trận, `requirePermission()` (chưa đăng nhập / locked / thiếu quyền), Server Action admin từ chối khi sai vai trò (mock `auth()`), zod của form đăng ký |
| **orders** (5.2) khuyến khích | `order.rules.ts` (`canCancel` theo trạng thái), `OrderStatusFilter` cập nhật URL |
| **assistant** (3) khuyến khích | `useAssistantStore` (thêm tin, reset), luồng khách → đăng nhập → `SaveConversationDialog` → `claimConversation` |
| **Hooks** | `useDebounce` (fake timers), `usePagination<T>`, `useProductFilters` (`renderHook` + `act`) |

Mỗi module: **≥ 10 test case**, có ít nhất **1 test bất đồng bộ với API được mock**, **coverage ≥ 70%**.

### 12.3 Quy tắc viết test
- Mẫu **Arrange – Act – Assert**; mỗi test **một hành vi**; tên mô tả tự nhiên (`'vô hiệu hoá nút khi hết hàng'`, không `'test 1'`).
- Thứ tự query: **`getByRole`** → `getByLabelText` → `getByText` → `getByTestId` (cuối cùng).
- `getBy` (chắc chắn có) · `queryBy` (khẳng định KHÔNG có) · `findBy` (bất đồng bộ, `await`).
- `userEvent.setup()` + `await user.click/type` thay vì `fireEvent`.
- Bất đồng bộ: `findBy` / `waitFor`. **Cấm** `setTimeout`/sleep thủ công. Timer: `jest.useFakeTimers()` + `advanceTimersByTime`, nhớ `useRealTimers()`.
- Mock: `jest.fn()`, `jest.spyOn` (nhớ `mockRestore`), `jest.mock('./api')` + `mockResolvedValue/mockRejectedValue`; integration lớn dùng `msw`.
- `afterEach(() => jest.clearAllMocks())`; test **độc lập thứ tự**.
- Dữ liệu mẫu qua factory: `makeProduct(override: Partial<Product> = {})`.
- Component dùng store → `renderWithProviders(ui, preloadedState)` (store **mới** mỗi test). Kiểm tra qua **UI**, không đọc store trực tiếp.
- Reducer test như hàm thuần (`reducer(state, action)` + `toEqual`); Zustand: gọi action rồi đọc `getState()`.
- Snapshot chỉ cho component nhỏ, ổn định. **Không** test state nội bộ, tên hàm, thư viện bên thứ ba.

```ts
// jest.config.ts (trích)
coverageThreshold: { global: { branches: 70, lines: 80 } },
collectCoverageFrom: ['src/features/**/*.{ts,tsx}', 'src/entities/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
```

---

## 13. Quy trình làm việc

### 13.1 Git
- Nhánh: `feat/<feature>-<mô-tả>`, `fix/...`, `chore/...`, `test/...`. Không push thẳng `main`.
- Commit theo Conventional Commits: `feat(cart): add updateQuantity reducer`.
- PR nhỏ (< ~400 dòng thay đổi), 1 PR = 1 mục đích, ≥ 1 reviewer approve.
- CI chạy: `lint` → `tsc --noEmit` → `test --coverage` → `build`. Đỏ = không merge.

### 13.2 Definition of Done (một task chỉ "Done" khi)
- [ ] Đúng chức năng theo acceptance criteria; đã tự test trên `npm run build && npm start`.
- [ ] Không `any`, không `@ts-ignore`, `tsc` & ESLint sạch.
- [ ] Đúng thư mục feature theo FDD (mục 3), có comment mã FDD, đúng loại state (mục 7), đúng chiến lược render (mục 5).
- [ ] Có test cho logic mới; test cũ vẫn xanh; coverage không tụt dưới ngưỡng.
- [ ] Trang/route mới: có `loading`/`error` phù hợp, metadata, noindex nếu riêng tư.
- [ ] Route/action cần quyền: đủ 4 lớp bảo vệ.
- [ ] Không có secret trong diff.
- [ ] Nếu là PR tối ưu: có số liệu Profiler/Lighthouse **trước/sau**.

### 13.3 PR template (copy vào mô tả PR)
```md
## Mục đích (mã FDD: x.y.z)
## Thay đổi chính
## Chiến lược render (nếu đụng route) — dán bảng `npm run build`
## State đặt ở đâu & vì sao
## Bảo mật: middleware / page / action / data — đã kiểm tra lớp nào
## Test: case đã thêm, coverage module
## Ảnh chụp / số liệu Lighthouse (nếu có)
```

---

## 14. Lộ trình sprint đề xuất (theo nhánh FDD)

| Sprint | Mục tiêu | Deliverable chính | FDD | Buổi |
|---|---|---|---|---|
| **0 — Setup** (2–3 ngày) | Khung dự án | `create-next-app` + TS strict, ESLint (kèm luật chặn import sâu), Prettier, alias `@/`, **toàn bộ khung thư mục mục 3** (file rỗng + `index.ts`), `types/api.ts`, `lib/api/http.ts`, `baseApi`, Jest + RTL, CI, `.env.example`, **chốt version Next.js/Auth.js & hợp đồng API với backend** | — | 1, 6, 7 |
| **1 — Khám phá sản phẩm** | Trang công khai + SEO | Trang chủ, danh mục, tìm/lọc/sắp xếp, chi tiết SP, hiển thị đánh giá; `next/image`, `next/font`, metadata, sitemap, robots, JSON-LD, opengraph-image | 2 | 7, 8 |
| **2 — Tài khoản & phân quyền** | Đăng nhập + RBAC | Auth.js (email, Google, Facebook), đăng ký, quên/đặt lại mật khẩu, đăng xuất; `permissions.ts`, `guards.ts`, middleware, `/403`; hồ sơ, địa chỉ; khung `admin/layout` | 1 | 8 |
| **3 — Mua hàng** | Giỏ → đặt → trả tiền → đơn | `cartSlice` + gộp giỏ khi đăng nhập, Mua ngay, checkout (địa chỉ, mã giảm giá, COD/PayOS), trang kết quả, DS/chi tiết/huỷ đơn, viết đánh giá | 4, 5 | 3, 4 |
| **4 — AI & thông báo** | Trợ lý + giữ chân người dùng | Chat streaming, câu hỏi nhanh, SP gợi ý, hội thoại khách theo phiên + lưu khi đăng nhập, lịch sử; cảnh báo giá; chuông thông báo + trang thông báo | 3, 6 | 2, 4 |
| **5 — Quản trị** | Vận hành cửa hàng | Danh mục, sản phẩm + tồn kho, thống kê (chart `next/dynamic`), đơn hàng + cập nhật trạng thái + xác nhận COD, giao dịch, mã giảm giá, người dùng (role, trạng thái) | 7, 8 | 5, 8 |
| **6 — Chất lượng** | Tối ưu + test + báo cáo | Profiler sửa re-render, virtualization bảng lớn, bundle analyzer; bộ test các module ở mục 12.2 (≥ 70%); Lighthouse trước/sau; sơ đồ 4 lớp bảo vệ | — | 5, 6, 8 |

> Team ≥ 3 dev: sau Sprint 2, có thể chạy **song song** Sprint 3 (FE-1), Sprint 4 (FE-2), Sprint 5 (FE-3) vì các nhánh nằm ở thư mục feature tách biệt. Chỗ chạm nhau duy nhất là `components/layout/` và `lib/permissions.ts`, nên mọi thay đổi ở đó phải có PR riêng và được review.

---

## 15. Lỗi hay gặp — đọc trước khi hỏi

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| "useState only works in Client Components" | Dùng hook/`onClick` trong Server Component | Tách phần tương tác ra component lá có `'use client'` |
| Hydration mismatch | `Date.now()`, `Math.random()`, `window` khi render SSR | Đưa vào `useEffect` / `next/dynamic` `ssr:false` |
| Trang SSG không cập nhật dữ liệu mới | Thiếu `revalidate` / `revalidatePath` | Thêm ISR theo bảng mục 5 |
| Trang tưởng SSG nhưng build ra `ƒ Dynamic` | Dùng `cookies()`/`headers()`/`auth()` hoặc `no-store` | Kiểm tra lại, tách phần động ra |
| `params.id` undefined / lỗi kiểu | Next 15: `params` là Promise | `const { id } = await params` |
| Dữ liệu user A lộ sang user B | Redux store singleton trên server | `makeStore()` trong `StoreProvider` |
| User thường vào được `/admin/xxx` | Chỉ check ở layout hoặc chỉ middleware | Check `auth()+can()` trong từng page & action |
| `React.memo` không có tác dụng | Prop hàm/object tạo mới mỗi render | `useCallback` / `useMemo` / hằng số |
| List giật, mất state dòng khi xoá | `key={index}` | `key={item.id}` |
| Lighthouse điểm thấp bất thường | Đo trên `npm run dev` | `npm run build && npm start`, chế độ ẩn danh |
| bcrypt lỗi trong middleware | Middleware chạy Edge runtime | Dùng `auth.config.ts` nhẹ cho middleware |
| `session.user.role` báo lỗi TS | Chưa augmentation | `types/next-auth.d.ts` |
| Test flaky khi chờ API | Dùng `getBy` cho phần tử bất đồng bộ / sleep thủ công | `findBy` / `waitFor` |
| Đơn hiện "đã thanh toán" dù chưa trả tiền | Tin `?status=PAID` trên `returnUrl` của PayOS | `/checkout/result` hỏi backend trạng thái thật theo `orderCode` |
| Tổng tiền đơn sai / bị sửa | Lấy giá & giảm giá từ client gửi lên | `placeOrder` tính lại toàn bộ ở server |
| `catalog` import `cart` → vòng import | Feature gọi thẳng feature khác | Ghép ở page trong `app/`; chỉ import qua `index.ts` |
| Hội thoại AI của khách mất khi đăng nhập | Xoá sessionStorage trước khi hỏi lưu | Hiện `SaveConversationDialog` trước, claim xong mới xoá |

---

## 16. Tài liệu tham khảo
- TypeScript Handbook — typescriptlang.org/docs
- React Docs — react.dev (Context, memo/useMemo/useCallback, Server Components)
- Redux Toolkit TypeScript Guide & RTK Query — redux-toolkit.js.org
- Zustand TypeScript Guide
- Jest — jestjs.io · Testing Library Guiding Principles — testing-library.com · Kent C. Dodds, *Common mistakes with React Testing Library*
- Next.js Docs (App Router, Authentication, Middleware) — nextjs.org/docs · Next.js Learn
- Auth.js — authjs.dev
- web.dev/lighthouse · Google Search Central (Core Web Vitals) · Rich Results Test

> **Nguyên tắc cuối:** khi phân vân, chọn phương án **đơn giản hơn, an toàn hơn, đo được**. Có số liệu thì tranh luận, không có số liệu thì làm theo tài liệu này.
