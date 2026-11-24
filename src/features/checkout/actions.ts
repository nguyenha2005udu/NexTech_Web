"use server";

// FDD 5.1.1 — Đặt hàng (COD | PayOS/VietQR). Server Action là endpoint công khai nên đủ lớp bảo vệ (mục 10.3):
// requirePermission("order:create") → zod → lấy giá/tồn kho THẬT ở server → kiểm địa chỉ của chính người dùng
// → kiểm mã giảm giá → tính lại tiền bằng pricing.ts (mục 5: không tin giá client) → tạo đơn.
// Backend (order-service) vẫn kiểm lại một lần nữa.
import { routes } from "@/config/routes";
import { addressService } from "@/entities/address/service";
import { couponService } from "@/entities/coupon/service";
import { orderService } from "@/entities/order/service";
import { productService } from "@/entities/product/service";
import { failed, invalid } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { priceOrder } from "./pricing";
import { placeOrderSchema } from "./schemas";

export type PlaceOrderResult = {
  orderId: string;
  /** PayOS: trang thanh toán của PayOS. COD: trang kết quả của web. */
  redirectTo: string;
  /** Sản phẩm đã đặt — client bỏ khỏi giỏ */
  productIds: string[];
};

export async function placeOrder(input: unknown): Promise<ActionResult<PlaceOrderResult>> {
  await requirePermission("order:create");
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { items, addressId, couponCode, paymentMethod } = parsed.data;

  const products = await productService.getManyByIds(items.map((i) => i.productId));
  const lines = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return { ok: false, message: "Có sản phẩm không còn được bán. Vui lòng kiểm tra lại giỏ hàng." };
    if (!product.inStock) return { ok: false, message: `${product.name} đã hết hàng.` };
    lines.push({ productId: product.id, price: product.price, quantity: item.quantity });
  }

  const address = await addressService.getMine(addressId);
  if (!address) {
    return { ok: false, message: "Địa chỉ giao hàng không hợp lệ", fieldErrors: { addressId: "Chọn lại địa chỉ" } };
  }

  const coupon = couponCode ? await couponService.findByCode(couponCode) : null;
  if (couponCode && !coupon) {
    return { ok: false, message: "Mã giảm giá không tồn tại", fieldErrors: { couponCode: "Mã giảm giá không tồn tại" } };
  }

  const pricing = priceOrder(lines, coupon, new Date());
  if (pricing.couponError) {
    return { ok: false, message: pricing.couponError, fieldErrors: { couponCode: pricing.couponError } };
  }

  try {
    const order = await orderService.create({
      items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, unit_price: l.price })),
      address_id: address.id,
      discount_code: coupon?.code ?? null,
      payment_method: paymentMethod,
      subtotal: pricing.subtotal,
      shipping_fee: pricing.shippingFee,
      discount_amount: pricing.discount,
      total: pricing.total,
    });
    return {
      ok: true,
      data: {
        orderId: order.id,
        redirectTo: order.checkout_url ?? routes.checkoutResult(order.id),
        productIds: lines.map((l) => l.productId),
      },
    };
  } catch (err) {
    return failed(err);
  }
}
