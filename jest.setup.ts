// Bổ sung matcher DOM cho expect: toBeInTheDocument, toHaveAttribute, toBeDisabled…
import "@testing-library/jest-dom";

// jsdom không có matchMedia; antd (Layout.Sider, Grid, responsive…) gọi nó khi mount.
// Chỉ gắn trong môi trường jsdom — test chạy `@jest-environment node` không có window.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// jsdom cũng không có ResizeObserver; antd Menu (rc-overflow) cần khi mount.
if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(window, "ResizeObserver", { writable: true, value: ResizeObserverStub });
}
