// Bổ sung matcher DOM cho expect: toBeInTheDocument, toHaveAttribute, toBeDisabled…
import "@testing-library/jest-dom";
import { installFetchPolyfill } from "@/test/fetch-polyfill";

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

// jsdom không có MessageChannel; antd Form/Select (@rc-component) dùng nó để hoãn việc sang macrotask
// (port2.postMessage → port1.onmessage). Stub bằng setTimeout là đủ cho cách dùng này.
if (typeof window !== "undefined" && typeof globalThis.MessageChannel === "undefined") {
  type Handler = ((event: MessageEvent) => void) | null;
  class MessagePortStub {
    onmessage: Handler = null;
    target: MessagePortStub | null = null;
    postMessage(data: unknown): void {
      const target = this.target;
      setTimeout(() => target?.onmessage?.(new MessageEvent("message", { data })), 0);
    }
    start(): void {}
    close(): void {}
  }
  class MessageChannelStub {
    port1 = new MessagePortStub();
    port2 = new MessagePortStub();
    constructor() {
      this.port1.target = this.port2;
      this.port2.target = this.port1;
    }
  }
  Object.defineProperty(globalThis, "MessageChannel", { writable: true, value: MessageChannelStub });
}

// jsdom không hỗ trợ getComputedStyle(elt, pseudoElt) và in lỗi "Not implemented" kèm stack mỗi lần antd đo
// thanh cuộn (::-webkit-scrollbar) — làm test chậm và nhiễu log. Bỏ tham số pseudoElt (kết quả jsdom như nhau).
if (typeof window !== "undefined") {
  const original = window.getComputedStyle.bind(window);
  window.getComputedStyle = (elt: Element) => original(elt);
}

// RTK Query (fetchBaseQuery) cần Headers/Request/Response — jsdom không có.
if (typeof window !== "undefined") installFetchPolyfill();
