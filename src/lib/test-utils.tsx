// Tiện ích dùng chung cho test (mục 12.3): factory dữ liệu mẫu + render kèm store. Chỉ import trong *.test.ts(x).
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { StyleProvider } from "@ant-design/cssinjs";
import { App } from "antd";
import type { CartItem } from "@/features/cart";
import type { Product, ProductFilters } from "@/entities/product";
import { makeStore, type AppStore, type RootState } from "@/lib/store";

let seq = 0;

/** Sản phẩm mẫu hợp lệ; ghi đè trường cần thiết cho từng test. */
/**
 * Render component antd (Modal / Form / Select / Popconfirm…) trong `<App>` (để dùng `App.useApp().message`).
 * `StyleProvider mock="server"`: antd không chèn CSS-in-JS vào DOM. Nếu chèn, mỗi `getComputedStyle` của jsdom
 * (getByRole kiểm phần tử ẩn, userEvent kiểm pointer-events) phải duyệt hết stylesheet — đo được 1 lần
 * `getByRole` ≈ 12 s khi chạy kèm `--coverage` → quá timeout. Test kiểm hành vi, không cần CSS thật.
 */
export function renderWithAntd(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <StyleProvider mock="server">
        <App>{children}</App>
      </StyleProvider>
    ),
    ...options,
  });
}

/** `userEvent.setup()` bỏ kiểm `pointer-events` (cũng gọi `getComputedStyle` lên cả cây trước mỗi thao tác). */
export function setupUser() {
  return userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
}

export function makeProduct(override: Partial<Product> = {}): Product {
  seq += 1;
  return {
    id: `p-${seq}`,
    slug: `san-pham-${seq}`,
    name: `Sản phẩm ${seq}`,
    brand: "ASUS",
    categorySlug: "laptop",
    tag: "Học tập",
    summary: "Core i5 · 16 GB RAM · SSD 512 GB",
    headline: "Core i5 · 16 GB RAM · SSD 512 GB",
    price: 15_000_000,
    rating: 4.5,
    reviewCount: 10,
    inStock: true,
    ram: "16 GB",
    cpu: "Intel Core i5",
    specs: [],
    images: [],
    ...override,
  };
}

/** Một dòng giỏ hàng mẫu (đã chọn, số lượng 1). */
export function makeCartItem(override: Partial<CartItem> = {}): CartItem {
  seq += 1;
  return {
    productId: `p-${seq}`,
    slug: `san-pham-${seq}`,
    name: `Sản phẩm ${seq}`,
    summary: "Core i5 · 16 GB RAM",
    imageSrc: "/images/products/laptop-blue.svg",
    price: 10_000_000,
    quantity: 1,
    maxQuantity: 10,
    selected: true,
    ...override,
  };
}

/** Bộ lọc rỗng (mặc định khi URL không có tham số). */
export function makeFilters(override: Partial<ProductFilters> = {}): ProductFilters {
  return { brands: [], rams: [], cpus: [], sort: "relevance", ...override };
}

type ProviderOptions = Omit<RenderOptions, "wrapper"> & { preloadedState?: Partial<RootState> };

/**
 * Render component cần Redux. Mỗi lần gọi tạo store MỚI (test độc lập thứ tự).
 * Kiểm tra kết quả qua UI; `store` trả về chỉ dùng để dispatch chuẩn bị dữ liệu khi cần.
 */
export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, ...options }: ProviderOptions = {},
): ReturnType<typeof render> & { store: AppStore } {
  const store = makeStore(preloadedState);
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
