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
import { readPaymentContext, writePaymentContext } from "./payment-context";
import { SHIPPING_FEE } from "./pricing";
import { placeOrderSchema, retryPaymentSchema, startPaymentSchema } from "./schemas";

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
 * FDD 5.1.2 — "Thanh toán lại" ở trang kết quả (Figma 03.11): xin backend link PayOS mới cho đơn CÒN `pending` của chính
 * người dùng. Backend dùng lại giao dịch `failed` với mã PayOS mới (BR-08) và kiểm lại lần nữa (409 nếu giao dịch chưa
 * thất bại). Đơn đã huỷ/hết hạn giữ hàng thì không thanh toán lại được, phải đặt lại.
 */
export async function retryPayment(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  await requirePermission("order:own");
  const parsed = retryPaymentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const order = await orderService.getMine(parsed.data.orderId);
  if (!order) return { ok: false, message: "Không tìm thấy đơn hàng" };
  if (order.status === "paid" || order.status === "shipped") {
    return { ok: false, message: "Đơn hàng này không cần thanh toán lại" };
  }
  if (order.status !== "pending") {
    return { ok: false, message: "Đơn hàng không còn chờ thanh toán. Vui lòng đặt lại." };
  }
  const context = await readPaymentContext();
  if (context?.orderId === order.id && context.method === "cod") {
    return { ok: false, message: "Đơn hàng này không cần thanh toán lại" };
  }

  try {
    const payment = await orderService.createPayment(order.id, "payos");
    await writePaymentContext({ orderId: order.id, paymentId: payment.id, method: "payos" });
    if (!payment.checkout_url) return { ok: false, message: "Chưa tạo được link thanh toán mới. Vui lòng thử lại sau." };
    return { ok: true, data: { redirectTo: payment.checkout_url } };
  } catch (err) {
    return failed(err);
  }
}

/**
 * FDD 5.1.2 — Tạo giao dịch cho đơn đặt lúc backend còn `processing` (202): lúc đó chưa tạo được giao dịch. Trang kết quả
 * gọi khi đơn đã sang `pending`. Phương thức lấy từ cookie lúc đặt hàng; đơn và giao dịch vẫn do backend kiểm quyền sở hữu.
 */
export async function startPayment(input: unknown): Promise<ActionResult<{ redirectTo: string | null }>> {
  await requirePermission("order:own");
  const parsed = startPaymentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { orderId } = parsed.data;

  const context = await readPaymentContext();
  if (context?.orderId !== orderId) {
    return { ok: false, message: "Không tìm thấy thông tin thanh toán của đơn này. Vui lòng xem trạng thái trong Đơn hàng của tôi." };
  }
  // Đã có giao dịch rồi (bấm lặp, hoặc mở lại trang): không tạo thêm.
  if (context.paymentId) return { ok: true, data: { redirectTo: null } };

  const order = await orderService.getMine(orderId);
  if (!order) return { ok: false, message: "Không tìm thấy đơn hàng" };
  if (order.status !== "pending") return { ok: false, message: "Đơn hàng không còn chờ thanh toán" };

  try {
    const payment = await orderService.createPayment(orderId, context.method);
    await writePaymentContext({ ...context, paymentId: payment.id });
    if (context.method === "payos") {
      if (!payment.checkout_url) return { ok: false, message: "Chưa tạo được link thanh toán. Vui lòng thử lại sau." };
      return { ok: true, data: { redirectTo: payment.checkout_url } };
    }
    return { ok: true, data: { redirectTo: null } };
  } catch (err) {
    return failed(err);
  }
}
