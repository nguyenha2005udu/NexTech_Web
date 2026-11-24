/** @jest-environment node */
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
