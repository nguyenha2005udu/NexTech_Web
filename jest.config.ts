// Jest + React Testing Library (mục 12). next/jest lo transform SWC, mock CSS/ảnh/next/font, nạp .env.
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

// Ngưỡng coverage của mục 12.1 (branches 70, lines 80) áp cho TỪNG module đã có test.
// Chưa bật ngưỡng toàn cục vì phần lớn code chưa có test — thêm module vào đây khi viết test cho nó,
// đủ module thì chuyển sang `global`.
const MODULE_THRESHOLD = { branches: 70, lines: 80 };

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Gói server-only ném lỗi khi bị import ngoài server; trong test chỉ cần bỏ qua.
    "^server-only$": "<rootDir>/src/test/server-only-stub.ts",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  clearMocks: true,
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/features/**/*.{ts,tsx}",
    "src/entities/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/lib/test-utils.tsx",
    "!src/test/**",
  ],
  coverageThreshold: {
    global: {},
    "./src/entities/product/filters.ts": MODULE_THRESHOLD,
    "./src/features/catalog/hooks/useProductFilters.ts": MODULE_THRESHOLD,
    "./src/lib/permissions.ts": MODULE_THRESHOLD,
    "./src/lib/auth/guards.ts": MODULE_THRESHOLD,
    "./src/lib/format.ts": MODULE_THRESHOLD,
    "./src/lib/action-result.ts": MODULE_THRESHOLD,
    "./src/lib/api/http.ts": MODULE_THRESHOLD,
    "./src/features/cart/model/": MODULE_THRESHOLD,
    "./src/features/cart/cart.storage.ts": MODULE_THRESHOLD,
    "./src/features/cart/components/": MODULE_THRESHOLD,
    "./src/features/cart/hooks/": MODULE_THRESHOLD,
    "./src/features/checkout/": MODULE_THRESHOLD,
    "./src/features/orders/": MODULE_THRESHOLD,
    "./src/features/notifications/": MODULE_THRESHOLD,
    "./src/entities/notification/service.ts": MODULE_THRESHOLD,
    "./src/entities/notification/meta.ts": MODULE_THRESHOLD,
    "./src/features/admin/dashboard/": MODULE_THRESHOLD,
    "./src/features/admin/categories/": MODULE_THRESHOLD,
    "./src/features/admin/products/": MODULE_THRESHOLD,
    "./src/features/admin/orders/": MODULE_THRESHOLD,
    "./src/features/admin/coupons/": MODULE_THRESHOLD,
    "./src/entities/coupon/admin-service.ts": MODULE_THRESHOLD,
    "./src/entities/coupon/status.ts": MODULE_THRESHOLD,
    "./src/entities/product/admin-service.ts": MODULE_THRESHOLD,
    "./src/entities/order/admin-service.ts": MODULE_THRESHOLD,
    "./src/features/admin/transactions/": MODULE_THRESHOLD,
    "./src/entities/transaction/admin-service.ts": MODULE_THRESHOLD,
    "./src/entities/transaction/status.ts": MODULE_THRESHOLD,
    "./src/lib/api/query-string.ts": MODULE_THRESHOLD,
  },
};

// Export dạng hàm để next/jest đọc được next.config (bất đồng bộ).
export default createJestConfig(config);
