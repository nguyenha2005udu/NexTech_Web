import { act, renderHook } from "@testing-library/react";
import { useAdminListParams } from "./useAdminListParams";
import { useDebounce } from "./useDebounce";

const replace = jest.fn();
let currentSearch = "";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/categories",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

function renderWithUrl(search: string) {
  currentSearch = search;
  return renderHook(() => useAdminListParams());
}

describe("useAdminListParams", () => {
  it("đọc tham số và trang hiện tại", () => {
    const { result } = renderWithUrl("q=lap&status=active&page=3");
    expect(result.current.get("q")).toBe("lap");
    expect(result.current.get("missing")).toBeUndefined();
    expect(result.current.page).toBe(3);
  });

  it("trang không hợp lệ hoặc thiếu → trang 1", () => {
    expect(renderWithUrl("page=abc").result.current.page).toBe(1);
    expect(renderWithUrl("page=-2").result.current.page).toBe(1);
    expect(renderWithUrl("").result.current.page).toBe(1);
  });

  it("đổi bộ lọc → ghi URL và về trang 1, không cuộn trang", () => {
    const { result } = renderWithUrl("q=lap&page=3");
    act(() => result.current.setParams({ status: "hidden" }));
    expect(replace).toHaveBeenCalledWith("/admin/categories?q=lap&status=hidden", { scroll: false });
  });

  it("giá trị rỗng / undefined / null → xoá tham số", () => {
    const { result } = renderWithUrl("q=lap&status=active");
    act(() => result.current.setParams({ q: "", status: undefined }));
    expect(replace).toHaveBeenCalledWith("/admin/categories", { scroll: false });
  });

  it("đổi trang giữ nguyên bộ lọc", () => {
    const { result } = renderWithUrl("q=lap&page=1");
    act(() => result.current.setParams({ page: 2 }));
    expect(replace).toHaveBeenCalledWith("/admin/categories?q=lap&page=2", { scroll: false });
  });

  it("mở / đóng modal không làm mất trang hiện tại", () => {
    const { result } = renderWithUrl("page=2");
    act(() => result.current.setParams({ modal: "edit", id: "c-1" }));
    expect(replace).toHaveBeenLastCalledWith("/admin/categories?page=2&modal=edit&id=c-1", { scroll: false });

    currentSearch = "page=2&modal=edit&id=c-1";
    act(() => result.current.setParams({ modal: null, id: null }));
    expect(replace).toHaveBeenLastCalledWith("/admin/categories?page=2", { scroll: false });
  });
});

describe("useDebounce", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("chỉ trả giá trị mới sau khi đứng yên đủ thời gian", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: "a" } });

    rerender({ value: "ab" });
    act(() => jest.advanceTimersByTime(299));
    expect(result.current).toBe("a");

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe("ab");
  });

  it("gõ liên tục thì hẹn giờ lại từ đầu", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: "a" } });

    rerender({ value: "ab" });
    act(() => jest.advanceTimersByTime(200));
    rerender({ value: "abc" });
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe("a");

    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });
});
