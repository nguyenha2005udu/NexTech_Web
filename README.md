# NexTech frontend

Khung Next.js App Router + TypeScript strict, alias `@/*` → `src/*`.
Giữ cấu trúc feature theo mục 3 của tài liệu frontend. Các trang hiện trả về `null` (trang trắng).

## Chạy local

Yêu cầu Node.js >= 20.9 và npm.

```sh
npm ci
npm run dev
```

Mở http://localhost:3000. Khi giải nén ZIP, mở terminal trong thư mục `nextech-frontend`.

## Kiểm tra và chạy production

```sh
npm run lint
npm run typecheck
npm test                # Jest + React Testing Library
npm run test:coverage   # kèm báo cáo coverage (CI chạy lệnh này)
npm run build
npm start
```

## Test

Jest cấu hình qua `next/jest` (`jest.config.ts`), môi trường `jsdom`; test đặt cạnh file nguồn (`*.test.ts(x)`).
Factory dữ liệu mẫu ở `src/lib/test-utils.tsx`. Code chạy ở server (guard, service) khai báo
`@jest-environment node` ở đầu file test. Ngưỡng coverage đang áp theo từng module đã có test.

Khung chưa có UI, logic nghiệp vụ, backend, xác thực hay phân quyền.
Các URL hiện chỉ là trang trắng công khai; thư mục API chưa có handler.
Không cần file môi trường để chạy khung này. `.env.example` dành cho bước tích hợp sau.
Các thư mục rỗng có `.gitkeep` để được giữ khi commit Git.

## Phiên bản đã chốt

- next: 16.4.5
- react: 19.3.1
- react-dom: 19.3.1
- typescript: 5.9.3
