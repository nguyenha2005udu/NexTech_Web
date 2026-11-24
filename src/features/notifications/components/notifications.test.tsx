import { screen, waitFor } from "@testing-library/react";
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

let server: Data;
let fetchMock: jest.Mock;

function respond(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

const isMarkRead = (input: unknown) => String((input as Request).url).endsWith("/notifications/read");

beforeEach(() => {
  server = { items: [note(), note({ id: "n-2", title: "Thanh toán thành công", type: "payment", is_read: true, link: null })], unread: 1 };
  fetchMock = jest.fn(async (input: Request) => {
    if (isMarkRead(input)) {
      const body = JSON.parse((await input.text()) || "{}") as { ids?: string[] };
      const items = server.items.map((n) => (!body.ids || body.ids.includes(n.id) ? { ...n, is_read: true } : n));
      server = { items, unread: items.filter((n) => !n.is_read).length };
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
    expect(screen.getByRole("link", { name: /Thông báo/ })).toHaveAttribute("href", "/account/notifications");
  });

  it("không hiện badge khi đã đọc hết", async () => {
    server = { items: [note({ is_read: true })], unread: 0 };
    renderWithProviders(<NotificationBell />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByText(/chưa đọc/)).not.toBeInTheDocument();
  });

  it("khách (401) thì chỉ là link, không badge", async () => {
    fetchMock.mockImplementation(() => respond({ message: "Unauthorized" }, 401));
    renderWithProviders(<NotificationBell />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByRole("link", { name: /Thông báo/ })).toBeInTheDocument();
    expect(screen.queryByText(/chưa đọc/)).not.toBeInTheDocument();
  });

  it("badge hiện 99+ khi quá nhiều", async () => {
    server = { items: [], unread: 150 };
    renderWithProviders(<NotificationBell />);
    expect(await screen.findByText("99+")).toBeInTheDocument();
  });
});

describe("NotificationList", () => {
  it("hiện ngay dữ liệu từ server: loại, tiêu đề, nội dung và số chưa đọc", () => {
    renderWithProviders(<NotificationList initial={server} />);
    expect(screen.getByText("Đặt hàng thành công")).toBeInTheDocument();
    expect(screen.getByText("Đơn hàng")).toBeInTheDocument();
    expect(screen.getByText("Thanh toán")).toBeInTheDocument();
    expect(screen.getByText("1 thông báo chưa đọc")).toBeInTheDocument();
  });

  it("chưa có thông báo thì hiện trạng thái trống", () => {
    renderWithProviders(<NotificationList initial={{ items: [], unread: 0 }} />);
    expect(screen.getByText("Bạn chưa có thông báo nào.")).toBeInTheDocument();
  });

  it("'Xem chi tiết' đánh dấu đã đọc rồi mở đơn", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationList initial={server} />);
    await user.click(screen.getByRole("button", { name: "Xem chi tiết" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/account/orders/o-1"));
    const call = fetchMock.mock.calls.find(([input]) => isMarkRead(input));
    expect(JSON.parse(await (call?.[0] as Request).text())).toEqual({ ids: ["n-1"] });
    expect(await screen.findByText("Bạn đã đọc hết thông báo")).toBeInTheDocument();
  });

  it("thông báo không có link thì không có nút 'Xem chi tiết'; đã đọc thì không có nút đánh dấu", () => {
    renderWithProviders(<NotificationList initial={{ items: [note({ link: null, is_read: true })], unread: 0 }} />);
    expect(screen.queryByRole("button", { name: "Xem chi tiết" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đánh dấu đã đọc" })).not.toBeInTheDocument();
  });

  it("link ra ngoài trang bị bỏ qua", () => {
    renderWithProviders(<NotificationList initial={{ items: [note({ link: "https://evil.example" })], unread: 1 }} />);
    expect(screen.queryByRole("button", { name: "Xem chi tiết" })).not.toBeInTheDocument();
  });

  it("'Đánh dấu tất cả đã đọc' cập nhật số chưa đọc", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationList initial={server} />);
    await user.click(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }));
    expect(await screen.findByText("Bạn đã đọc hết thông báo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" })).toBeDisabled();
  });

  it("lỗi mạng khi đánh dấu thì báo lỗi, không chuyển trang", async () => {
    const user = setupUser();
    renderWithProviders(<NotificationList initial={server} />);
    fetchMock.mockImplementation(() => respond({ message: "boom" }, 500));
    await user.click(screen.getByRole("button", { name: "Đánh dấu đã đọc" }));
    expect(await screen.findByText("Không cập nhật được thông báo. Vui lòng thử lại.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
