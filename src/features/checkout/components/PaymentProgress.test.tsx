import { act, render, screen } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { startPayment } from "../actions";
import { PaymentStarter } from "./PaymentStarter";
import { MAX_REFRESHES, ProcessingRefresh, REFRESH_INTERVAL_MS } from "./ProcessingRefresh";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
jest.mock("../actions", () => ({ startPayment: jest.fn() }));
const mockStart = jest.mocked(startPayment);

afterEach(() => jest.clearAllMocks());

describe("ProcessingRefresh", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("báo đang cập nhật và tự tải lại trang sau mỗi vài giây", () => {
    render(<ProcessingRefresh />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang cập nhật trạng thái đơn hàng");
    expect(refresh).not.toHaveBeenCalled();

    act(() => void jest.advanceTimersByTime(REFRESH_INTERVAL_MS));
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => void jest.advanceTimersByTime(REFRESH_INTERVAL_MS));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("thôi tải lại sau số lần tối đa và hướng người dùng sang Đơn hàng của tôi", () => {
    render(<ProcessingRefresh />);
    for (let i = 0; i < MAX_REFRESHES; i++) act(() => void jest.advanceTimersByTime(REFRESH_INTERVAL_MS));
    expect(refresh).toHaveBeenCalledTimes(MAX_REFRESHES);
    expect(screen.getByRole("status")).toHaveTextContent("vẫn đang được xử lý");

    act(() => void jest.advanceTimersByTime(REFRESH_INTERVAL_MS * 5));
    expect(refresh).toHaveBeenCalledTimes(MAX_REFRESHES);
  });

  it("gỡ khỏi trang thì không tải lại nữa", () => {
    const { unmount } = render(<ProcessingRefresh />);
    unmount();
    act(() => void jest.advanceTimersByTime(REFRESH_INTERVAL_MS * 3));
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("PaymentStarter", () => {
  it("tự tạo giao dịch đúng một lần khi mở, COD thì tải lại trang để thấy kết quả", async () => {
    mockStart.mockResolvedValue({ ok: true, data: { redirectTo: null } });
    renderWithAntd(<PaymentStarter orderId="o-1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang tạo thanh toán");
    await act(async () => {});
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith({ orderId: "o-1" });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("lỗi thì hiện thông báo và cho bấm Thử lại", async () => {
    mockStart.mockResolvedValueOnce({ ok: false, message: "Lỗi tạo link thanh toán PayOS, vui lòng thử lại" });
    mockStart.mockResolvedValueOnce({ ok: true, data: { redirectTo: null } });
    const user = setupUser();
    renderWithAntd(<PaymentStarter orderId="o-1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Lỗi tạo link thanh toán PayOS");
    expect(refresh).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mockStart).toHaveBeenCalledTimes(2);
    await act(async () => {});
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
