import { screen, waitFor, within } from "@testing-library/react";
import type { Notification, NotificationList as Data } from "@/entities/notification";
import { renderWithProviders, setupUser } from "@/lib/test-utils";
import { NotificationBell } from "./NotificationBell";
import { NotificationList } from "./NotificationList";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const note = (override: Partial<Notification> = {}): Notification => ({
  id: "n-1",
  type: "order",
  title: "Đặt hàng thành công",
  body: "Đơn #A1B2C3D4 đang chờ xử lý.",
  link: "/account/orders/o-1",
  is_read: false,
  created_at: "2026-11-24T03:00:00.000Z",
  ...override,
});

/** Một trang dữ liệu giả; `total` mặc định = số item. */
const page = (items: Notification[], unread: number, extra: Partial<Data> = {}): Data => ({
  items,
  unread,
  page: 1,
  total: items.length,
  ...extra,
});

let server: Data;
let fetchMock: jest.Mock;

function respond(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

const isMarkRead = (input: unknown) => String((input as Request).url).endsWith("/notifications/read");

beforeEach(() => {
  server = page([note(), note({ id: "n-2", title: "Thanh toán thành công", type: "payment", is_read: true, link: null })], 1);
  fetchMock = jest.fn(async (input: Request) => {
    if (isMarkRead(input)) {
      const body = JSON.parse((await input.text()) || "{}") as { ids?: string[] };
      const items = server.items.map((n) => (!body.ids || body.ids.includes(n.id) ? { ...n, is_read: true } : n));
      server = page(items, items.filter((n) => !n.is_read).length);
      return respond({ ok: true });
    }
    return respond(server);
  });
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => jest.clearAllMocks());

describe("NotificationBell", () => {
  it("hiện số thông báo chưa đọc", async () => {
    renderWithProviders(<NotificationBell />);
    expect(await screen.findByText("(1 chưa đọc)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thông báo/ })).toHaveAttribute("aria-haspopup", "true");
  });

  it("chuông chỉ lấy vài thông báo mới nhất (limit nhỏ)", async () => {
    renderWithProviders(<NotificationBell />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String((fetchMock.mock.calls[0]?.[0] as Request).url)).toContain("limit=5");
  });

  it("bấm chuông mở dropdown, có link 'Xem tất cả thông báo'", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationBell />);
    await user.click(await screen.findByRole("button", { name: /Thông báo/ }));
    const panel = await screen.findByRole("region", { name: "Thông báo mới nhất" });
    expect(within(panel).getByText("Đặt hàng thành công")).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Xem tất cả thông báo" })).toHaveAttribute("href", "/account/notifications");
  });

  it("bấm một thông báo trong dropdown: đánh dấu đã đọc, mở đơn và đóng dropdown", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationBell />);
    await user.click(await screen.findByRole("button", { name: /Thông báo/ }));
    const panel = await screen.findByRole("region", { name: "Thông báo mới nhất" });
    await user.click(within(panel).getByRole("button", { name: /Đặt hàng thành công/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/account/orders/o-1"));
    const call = fetchMock.mock.calls.find(([input]) => isMarkRead(input));
    expect(JSON.parse(await (call?.[0] as Request).text())).toEqual({ ids: ["n-1"] });
    await waitFor(() => expect(screen.getByRole("button", { name: /Thông báo/ })).toHaveAttribute("aria-expanded", "false"));
  });

  it("thông báo đã đọc thì mở thẳng, không gọi API đánh dấu", async () => {
    server = page([note({ is_read: true })], 0);
    const user = setupUser();
    renderWithProviders(<NotificationBell />);
    await user.click(await screen.findByRole("button", { name: /Thông báo/ }));
    const panel = await screen.findByRole("region", { name: "Thông báo mới nhất" });
    await user.click(within(panel).getByRole("button", { name: /Đặt hàng thành công/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(fetchMock.mock.calls.some(([input]) => isMarkRead(input))).toBe(false);
  });

  it("thông báo có link ra ngoài chỉ được đánh dấu, không điều hướng", async () => {
    server = page([note({ link: "https://evil.example" })], 1);
    const user = setupUser();
    renderWithProviders(<NotificationBell />);
    await user.click(await screen.findByRole("button", { name: /Thông báo/ }));
    const panel = await screen.findByRole("region", { name: "Thông báo mới nhất" });
    await user.click(within(panel).getByRole("button", { name: /Đặt hàng thành công/ }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input]) => isMarkRead(input))).toBe(true));
    expect(push).not.toHaveBeenCalled();
  });

  it("'Đánh dấu tất cả đã đọc' trong dropdown xoá badge", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationBell />);
    await user.click(await screen.findByRole("button", { name: /Thông báo/ }));
    const panel = await screen.findByRole("region", { name: "Thông báo mới nhất" });
    await user.click(within(panel).getByRole("button", { name: "Đánh dấu tất cả đã đọc" }));
    await waitFor(() => expect(screen.queryByText(/chưa đọc/)).not.toBeInTheDocument());
  });

  it("chưa có thông báo thì dropdown báo trống", async () => {
    server = page([], 0);
    const user = setupUser();
    renderWithProviders(<NotificationBell />);
    await user.click(await screen.findByRole("button", { name: /Thông báo/ }));
    expect(await screen.findByText("Bạn chưa có thông báo nào.")).toBeInTheDocument();
  });

  it("không hiện badge khi đã đọc hết", async () => {
    server = page([note({ is_read: true })], 0);
    renderWithProviders(<NotificationBell />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByText(/chưa đọc/)).not.toBeInTheDocument();
  });

  it("khách (401) thì chỉ là link, không badge", async () => {
    fetchMock.mockImplementation(() => respond({ message: "Unauthorized" }, 401));
    renderWithProviders(<NotificationBell />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Thông báo/ })).toHaveAttribute("href", "/account/notifications"),
    );
    expect(screen.queryByText(/chưa đọc/)).not.toBeInTheDocument();
  });

  it("badge hiện 99+ khi quá nhiều", async () => {
    server = page([], 150);
    renderWithProviders(<NotificationBell />);
    expect(await screen.findByText("99+")).toBeInTheDocument();
  });
});

describe("NotificationList", () => {
  it("hiện ngay dữ liệu từ server: loại, tiêu đề, nội dung và số chưa đọc", () => {
    renderWithProviders(<NotificationList initial={server} pageSize={10} />);
    expect(screen.getByText("Đặt hàng thành công")).toBeInTheDocument();
    expect(screen.getByText("Đơn hàng")).toBeInTheDocument();
    expect(screen.getByText("Thanh toán")).toBeInTheDocument();
    expect(screen.getByText("1 thông báo chưa đọc")).toBeInTheDocument();
  });

  it("chưa có thông báo thì hiện trạng thái trống", () => {
    renderWithProviders(<NotificationList initial={page([], 0)} pageSize={10} />);
    expect(screen.getByText("Bạn chưa có thông báo nào.")).toBeInTheDocument();
  });

  it("'Xem chi tiết' đánh dấu đã đọc rồi mở đơn", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationList initial={server} pageSize={10} />);
    await user.click(screen.getByRole("button", { name: "Xem chi tiết" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/account/orders/o-1"));
    const call = fetchMock.mock.calls.find(([input]) => isMarkRead(input));
    expect(JSON.parse(await (call?.[0] as Request).text())).toEqual({ ids: ["n-1"] });
    expect(await screen.findByText("Bạn đã đọc hết thông báo")).toBeInTheDocument();
  });

  it("thông báo không có link thì không có nút 'Xem chi tiết'; đã đọc thì không có nút đánh dấu", () => {
    renderWithProviders(<NotificationList initial={page([note({ link: null, is_read: true })], 0)} pageSize={10} />);
    expect(screen.queryByRole("button", { name: "Xem chi tiết" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đánh dấu đã đọc" })).not.toBeInTheDocument();
  });

  it("link ra ngoài trang bị bỏ qua", () => {
    renderWithProviders(<NotificationList initial={page([note({ link: "https://evil.example" })], 1)} pageSize={10} />);
    expect(screen.queryByRole("button", { name: "Xem chi tiết" })).not.toBeInTheDocument();
  });

  it("'Đánh dấu tất cả đã đọc' cập nhật số chưa đọc", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationList initial={server} pageSize={10} />);
    await user.click(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }));
    expect(await screen.findByText("Bạn đã đọc hết thông báo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" })).toBeDisabled();
  });

  it("lỗi mạng khi đánh dấu thì báo lỗi, không chuyển trang", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationList initial={server} pageSize={10} />);
    fetchMock.mockImplementation(() => respond({ message: "boom" }, 500));
    await user.click(screen.getByRole("button", { name: "Đánh dấu đã đọc" }));
    expect(await screen.findByText("Không cập nhật được thông báo. Vui lòng thử lại.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("phân trang: hiện 'Trang 2 / 3' với link trang trước và trang sau", () => {
    const items = [note()];
    renderWithProviders(<NotificationList initial={page(items, 0, { page: 2, total: 25 })} pageSize={10} />);
    expect(screen.getByText("Trang 2 / 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Trang trước/ })).toHaveAttribute("href", "/account/notifications");
    expect(screen.getByRole("link", { name: /Trang sau/ })).toHaveAttribute("href", "/account/notifications?page=3");
  });

  it("trang đầu không có link 'Trang trước'; trang cuối không có 'Trang sau'", () => {
    const { unmount } = renderWithProviders(<NotificationList initial={page([note()], 0, { total: 25 })} pageSize={10} />);
    expect(screen.queryByRole("link", { name: /Trang trước/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Trang sau/ })).toBeInTheDocument();
    unmount();
    renderWithProviders(<NotificationList initial={page([note()], 0, { page: 3, total: 25 })} pageSize={10} />);
    expect(screen.queryByRole("link", { name: /Trang sau/ })).not.toBeInTheDocument();
  });

  it("một trang duy nhất thì không hiện phân trang", () => {
    renderWithProviders(<NotificationList initial={server} pageSize={10} />);
    expect(screen.queryByRole("navigation", { name: "Phân trang thông báo" })).not.toBeInTheDocument();
  });

  it("gọi API đúng trang đang xem", async () => {
    server = page([note()], 0, { page: 2, total: 25 });
    renderWithProviders(<NotificationList initial={server} pageSize={10} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = String((fetchMock.mock.calls[0]?.[0] as Request).url);
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
  });
});
