/** @jest-environment node */
import { notificationService } from "@/entities/notification/service";
import { orderService } from "./service";

const base = {
  items: [{ product_id: "p-1", quantity: 1, unit_price: 100 }],
  address_id: "addr-home",
  discount_code: null,
  subtotal: 100,
  shipping_fee: 30,
  discount_amount: 0,
  total: 130,
};

describe("orderService.create (mock)", () => {
  it("COD tạo đơn chờ xử lý, không có link thanh toán", async () => {
    const order = await orderService.create({ ...base, payment_method: "cod" });
    expect(order).toMatchObject({ status: "pending", total: 130, payment_method: "cod", checkout_url: null });
    expect(order.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("PayOS tạo đơn ở trạng thái đang tạo", async () => {
    expect((await orderService.create({ ...base, payment_method: "payos" })).status).toBe("processing");
  });
});

describe("orderService.getMine (mock)", () => {
  it("đọc lại được đơn vừa tạo", async () => {
    const created = await orderService.create({ ...base, payment_method: "payos" });
    expect(await orderService.getMine(created.id)).toEqual({
      id: created.id,
      status: "processing",
      total: 130,
      payment_method: "payos",
      payment_status: "pending",
    });
  });

  it("đơn không tồn tại trả null", async () => {
    expect(await orderService.getMine("khong-co")).toBeNull();
  });
});

describe("orderService — danh sách, chi tiết, huỷ (mock)", () => {
  it("chi tiết giữ snapshot tiền và địa chỉ lúc đặt", async () => {
    const created = await orderService.create({ ...base, payment_method: "cod", discount_code: "NEX200", discount_amount: 20 });
    expect(await orderService.getDetailMine(created.id)).toMatchObject({
      id: created.id,
      status: "pending",
      subtotal: 100,
      shipping_fee: 30,
      discount_amount: 20,
      discount_code: "NEX200",
      items: [{ product_id: "p-1", quantity: 1, unit_price: 100 }],
      shipping: { recipient_name: expect.any(String), full_address: expect.any(String) },
    });
  });

  it("danh sách mới nhất trước và lọc được theo trạng thái", async () => {
    jest.useFakeTimers({ now: new Date("2026-11-24T03:00:00Z") });
    const cod = await orderService.create({ ...base, payment_method: "cod" });
    jest.setSystemTime(new Date("2026-11-24T04:00:00Z"));
    const payos = await orderService.create({ ...base, payment_method: "payos" });
    jest.useRealTimers();
    const pendingIds = (await orderService.listMine("pending")).map((o) => o.id);
    expect(pendingIds).toContain(cod.id);
    expect(pendingIds).not.toContain(payos.id);
    const allIds = (await orderService.listMine()).map((o) => o.id);
    expect(allIds.indexOf(payos.id)).toBeLessThan(allIds.indexOf(cod.id));
  });

  it("huỷ đơn đổi trạng thái sang cancelled", async () => {
    const created = await orderService.create({ ...base, payment_method: "cod" });
    await orderService.cancel(created.id);
    expect((await orderService.getMine(created.id))?.status).toBe("cancelled");
  });

  it("huỷ đơn không tồn tại trả null", async () => {
    expect(await orderService.cancel("khong-co")).toBeNull();
  });
});

describe("orderService — sinh thông báo (mock)", () => {
  const notificationsFor = async (id: string) =>
    (await notificationService.list()).items.filter((n) => n.link?.includes(id));

  it("đặt COD báo 'Đặt hàng thành công' kèm link tới đơn", async () => {
    const created = await orderService.create({ ...base, payment_method: "cod" });
    expect(await notificationsFor(created.id)).toEqual([
      expect.objectContaining({ type: "order", title: "Đặt hàng thành công", link: `/account/orders/${created.id}` }),
    ]);
  });

  it("đặt PayOS báo thêm 'Đang chờ thanh toán'", async () => {
    const created = await orderService.create({ ...base, payment_method: "payos" });
    const titles = (await notificationsFor(created.id)).map((n) => n.title).sort();
    expect(titles).toEqual(["Đang chờ thanh toán", "Đặt hàng thành công"]);
  });

  it("huỷ đơn báo 'Đã huỷ đơn hàng'", async () => {
    const created = await orderService.create({ ...base, payment_method: "cod" });
    await orderService.cancel(created.id);
    expect((await notificationsFor(created.id)).map((n) => n.title)).toContain("Đã huỷ đơn hàng");
  });

  it("huỷ đơn không tồn tại không sinh thông báo", async () => {
    const before = (await notificationService.list()).items.length;
    await orderService.cancel("khong-co");
    expect((await notificationService.list()).items).toHaveLength(before);
  });
});
