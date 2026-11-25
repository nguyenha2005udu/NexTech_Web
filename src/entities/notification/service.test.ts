/** @jest-environment node */
import { notificationService } from "./service";

const sample = { type: "order" as const, title: "Đặt hàng thành công", body: "Đơn #A1", link: "/account/orders/a1" };

describe("notificationService (mock)", () => {
  it("push tạo thông báo chưa đọc, giữ link", async () => {
    const n = await notificationService.push(sample);
    expect(n).toMatchObject({ ...sample, is_read: false });
    expect(n.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("thông báo không có link thì link là null", async () => {
    expect((await notificationService.push({ type: "payment", title: "t", body: "b" })).link).toBeNull();
  });

  it("list mới nhất trước và đếm số chưa đọc", async () => {
    jest.useFakeTimers({ now: new Date("2026-11-24T03:00:00Z") });
    const older = await notificationService.push(sample);
    jest.setSystemTime(new Date("2026-11-24T04:00:00Z"));
    const newer = await notificationService.push(sample);
    jest.useRealTimers();
    const { items, unread } = await notificationService.list();
    expect(items.findIndex((n) => n.id === newer.id)).toBeLessThan(items.findIndex((n) => n.id === older.id));
    expect(unread).toBe(items.filter((n) => !n.is_read).length);
  });

  it("markRead theo id chỉ đổi đúng thông báo đó", async () => {
    const a = await notificationService.push(sample);
    const b = await notificationService.push(sample);
    await notificationService.markRead([a.id]);
    const { items } = await notificationService.list();
    expect(items.find((n) => n.id === a.id)?.is_read).toBe(true);
    expect(items.find((n) => n.id === b.id)?.is_read).toBe(false);
  });

  it("markRead không có ids thì đọc hết", async () => {
    await notificationService.push(sample);
    await notificationService.markRead();
    expect((await notificationService.list()).unread).toBe(0);
  });

  it("markRead với id lạ không lỗi", async () => {
    await expect(notificationService.markRead(["khong-co"])).resolves.toBeUndefined();
  });

  it("list phân trang: total/unread tính trên toàn bộ, items chỉ một trang", async () => {
    const all = await notificationService.list(1, 1000);
    const page1 = await notificationService.list(1, 2);
    const page2 = await notificationService.list(2, 2);
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(all.total);
    expect(page1.unread).toBe(all.unread);
    expect(page2.items.map((n) => n.id)).toEqual(all.items.slice(2, 4).map((n) => n.id));
    expect(page2.page).toBe(2);
  });

  it("trang vượt quá giới hạn trả danh sách rỗng nhưng vẫn có total", async () => {
    const { items, total } = await notificationService.list(9999, 10);
    expect(items).toEqual([]);
    expect(total).toBeGreaterThan(0);
  });
});
