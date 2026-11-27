"use server";

// FDD 5.1.1 — Đặt hàng (COD | PayOS/VietQR). Server Action là endpoint công khai nên đủ lớp bảo vệ (mục 10.3):
// requirePermission("order:create") → zod → kiểm giá/tồn kho THẬT ở server → kiểm địa chỉ của chính người dùng → thử mã
// giảm giá → đặt đơn.
// Giá, phí ship, mã giảm giá do BACKEND (order-service) tính và kiểm; web không gửi số tiền nào lên.
import { routes } from "@/config/routes";
import { addressService } from "@/entities/address/service";
import { couponService } from "@/entities/coupon/service";
import { orderService } from "@/entities/order/service";
import { productService } from "@/entities/product/service";
import { failed, invalid } from "@/lib/action-result";
import { ApiError } from "@/lib/api/http";
import { requirePermission } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/action";
import { writePaymentContext } from "./payment-context";
import { paymentResultOf } from "./payment-result";
import { SHIPPING_FEE } from "./pricing";
import { placeOrderSchema, retryPaymentSchema } from "./schemas";

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
  const { items, addressId, couponCodes, paymentMethod } = parsed.data;

  const products = await productService.getManyByIds(items.map((i) => i.productId));
  const lines = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return { ok: false, message: "Có sản phẩm không còn được bán. Vui lòng kiểm tra lại giỏ hàng." };
    if (!product.inStock || product.stockQuantity === 0) return { ok: false, message: `${product.name} đã hết hàng.` };
    if (product.stockQuantity !== undefined && item.quantity > product.stockQuantity) {
      return { ok: false, message: `${product.name} chỉ còn ${product.stockQuantity} sản phẩm.` };
    }
    lines.push({ productId: product.id, quantity: item.quantity, price: product.price });
  }

  const address = await addressService.getMine(addressId);
  if (!address) {
    return { ok: false, message: "Địa chỉ giao hàng không hợp lệ", fieldErrors: { addressId: "Chọn lại địa chỉ" } };
  }

  // Backend tách mã giảm đơn và mã freeship thành 2 ô (dùng đồng thời được); thử từng mã để biết gửi vào ô nào
  // và báo lỗi sớm ở ô mã. Mỗi loại tối đa 1 mã.
  let discountCode: string | null = null;
  let freeshipCode: string | null = null;
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  try {
    for (const code of couponCodes) {
      const check = await couponService.validate(code, subtotal, SHIPPING_FEE);
      if (!check.valid) return { ok: false, message: check.message, fieldErrors: { couponCodes: check.message } };
      const isFreeship = check.category === "free_shipping";
      if (isFreeship ? freeshipCode : discountCode) {
        const message = "Mỗi đơn chỉ dùng 1 mã giảm giá đơn hàng và 1 mã miễn phí vận chuyển";
        return { ok: false, message, fieldErrors: { couponCodes: message } };
      }
      if (isFreeship) freeshipCode = check.code;
      else discountCode = check.code;
    }
  } catch (err) {
    return failed(err);
  }

  try {
    const order = await orderService.create({
      items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
      address_id: address.id,
      discount_code: discountCode,
      freeship_code: freeshipCode,
      payment_method: paymentMethod,
    });
    // PayOS đưa khách về trang kết quả mà không mang theo id đơn/giao dịch → nhớ lại ở đây (xem payment-context.ts).
    await writePaymentContext({ orderId: order.id, paymentId: order.payment_id, method: paymentMethod });
    return {
      ok: true,
      data: {
        orderId: order.id,
        redirectTo: order.checkout_url ?? routes.checkoutResult(order.id, paymentMethod),
        productIds: lines.map((l) => l.productId),
      },
    };
  } catch (err) {
    // NT-PRM-*: lỗi mã giảm giá → gắn vào ô mã. Mã khác hiện thông báo chung.
    return failed(err, err instanceof ApiError && err.code?.startsWith("NT-PRM") ? { [err.code]: "couponCodes" } : {});
  }
}

/**
 * FDD 5.1.2 — "Thử lại" ở trang kết quả (Figma 03.11): xin backend link thanh toán PayOS mới cho đơn của chính
 * người dùng. Không áp dụng cho đơn COD / đơn chưa ở trạng thái thất bại; backend kiểm lại lần nữa.
 */
export async function retryPayment(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  await requirePermission("order:own");
  const parsed = retryPaymentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const order = await orderService.getMine(parsed.data.orderId);
  if (!order) return { ok: false, message: "Không tìm thấy đơn hàng" };
  if (order.payment_method === "cod" || paymentResultOf(order) !== "failed") {
    return { ok: false, message: "Đơn hàng này không cần thanh toán lại" };
  }

  try {
    const { checkout_url } = await orderService.retryPayment(order.id);
    if (!checkout_url) return { ok: false, message: "Chưa tạo được link thanh toán mới. Vui lòng thử lại sau." };
    return { ok: true, data: { redirectTo: checkout_url } };
  } catch (err) {
    return failed(err);
  }
}
