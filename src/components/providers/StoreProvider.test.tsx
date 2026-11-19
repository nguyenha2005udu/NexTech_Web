import { render, screen } from "@testing-library/react";
import { useAppStore } from "@/lib/hooks";
import type { AppStore } from "@/lib/store";
import { StoreProvider } from "./StoreProvider";

const seen: AppStore[] = [];

function StoreProbe() {
  seen.push(useAppStore());
  return <p>có store</p>;
}

describe("StoreProvider", () => {
  beforeEach(() => {
    seen.length = 0;
  });

  it("render children và cung cấp store cho hook", () => {
    render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    );
    expect(screen.getByText("có store")).toBeInTheDocument();
    expect(seen[0]?.getState()).toHaveProperty("api");
  });

  it("giữ nguyên một store qua các lần render lại", () => {
    const { rerender } = render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    );
    rerender(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    );
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(new Set(seen).size).toBe(1);
  });

  it("hai cây Provider độc lập có hai store khác nhau", () => {
    render(
      <>
        <StoreProvider>
          <StoreProbe />
        </StoreProvider>
        <StoreProvider>
          <StoreProbe />
        </StoreProvider>
      </>,
    );
    expect(new Set(seen).size).toBe(2);
  });
});
