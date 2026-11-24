"use server";

// FDD 4.1.2 — Đối chiếu giỏ với giá/tồn kho hiện tại. Dữ liệu catalog công khai nên không cần phiên, nhưng đầu vào
// vẫn qua zod (Server Action là endpoint công khai, mục 10.3). Kết quả chỉ để HIỂN THỊ — placeOrder tính lại giá.
import { z } from "zod";
import { productService } from "@/entities/product/service";
import type { ActionResult } from "@/types/action";
import type { CartSnapshot } from "./model/cartSlice";

const schema = z.object({ productIds: z.array(z.string().min(1).max(64)).max(50) });

export async function getCartSnapshots(input: unknown): Promise<ActionResult<CartSnapshot[]>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dữ liệu giỏ hàng không hợp lệ" };
  if (!parsed.data.productIds.length) return { ok: true, data: [] };

  const products = await productService.getManyByIds(parsed.data.productIds);
  return {
    ok: true,
    data: products.map((p) => ({
      productId: p.id,
      price: p.price,
      stockQuantity: p.stockQuantity,
      available: p.inStock && (p.stockQuantity === undefined || p.stockQuantity > 0),
    })),
  };
}
