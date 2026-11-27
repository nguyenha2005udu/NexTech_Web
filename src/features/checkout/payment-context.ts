import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";

// FDD 5.1.2 — Ngữ cảnh thanh toán của đơn vừa đặt. PayOS chỉ đưa khách về returnUrl kèm `orderCode` là MÃ SỐ của
// PayOS, không phải id đơn; hợp đồng backend (NT.PAYMENT) cũng để client tự giữ orderId/paymentId rồi hỏi
// `GET /api/payments/:id/status`. Vì vậy web nhớ chúng trong cookie httpOnly từ lúc đặt đơn tới lúc quay về.
//
// Cookie do người dùng sửa được → chỉ là GỢI Ý. Mọi giá trị vẫn đi qua backend, backend kiểm đơn và giao dịch
// có thuộc người đang đăng nhập không (404 / 403), nên không thể xem đơn của người khác.

export const PAYMENT_CONTEXT_COOKIE = "nextech_payment";
/** Đủ dài để khách trả tiền xong rồi quay lại; hạn giữ hàng của backend mặc định là 15 phút. */
export const PAYMENT_CONTEXT_MAX_AGE_SECONDS = 60 * 60;

const paymentContextSchema = z.object({
  orderId: z.string().min(1).max(64),
  /** `null` khi đơn chưa tạo được giao dịch (đơn còn `processing`, hoặc tạo link PayOS lỗi) */
  paymentId: z.string().min(1).max(64).nullable(),
  method: z.enum(["cod", "payos"]),
});

export type PaymentContext = z.infer<typeof paymentContextSchema>;

/** Chỉ gọi được trong Server Action / Route Handler (Server Component không ghi được cookie). */
export async function writePaymentContext(context: PaymentContext): Promise<void> {
  (await cookies()).set(PAYMENT_CONTEXT_COOKIE, JSON.stringify(context), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PAYMENT_CONTEXT_MAX_AGE_SECONDS,
  });
}

/** `null` khi không có cookie, hết hạn, hoặc nội dung sai định dạng. */
export async function readPaymentContext(): Promise<PaymentContext | null> {
  const raw = (await cookies()).get(PAYMENT_CONTEXT_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = paymentContextSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
