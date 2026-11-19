import { screen } from "@testing-library/react";
import { useAppSelector } from "./hooks";
import { renderWithProviders } from "./test-utils";

function QueryCount() {
  const count = useAppSelector((s) => Object.keys(s.api.queries).length);
  return <p>Số truy vấn: {count}</p>;
}

describe("useAppSelector + renderWithProviders", () => {
  it("đọc state từ store do renderWithProviders tạo", () => {
    const { store } = renderWithProviders(<QueryCount />);
    expect(screen.getByText("Số truy vấn: 0")).toBeInTheDocument();
    expect(store.getState().api.queries).toEqual({});
  });

  it("mỗi lần render dùng một store mới", () => {
    const first = renderWithProviders(<QueryCount />);
    first.unmount();
    const second = renderWithProviders(<QueryCount />);
    expect(second.store).not.toBe(first.store);
  });
});
