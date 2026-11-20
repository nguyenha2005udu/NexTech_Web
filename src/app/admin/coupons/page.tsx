// FDD 8.3 — Mã giảm giá (design/admin/05). SSR: danh sách theo ?q=&status=&page=, Modal theo ?modal=&id=.
import type { Metadata } from "next";
import { Card } from "antd";
import type { AdminCoupon } from "@/entities/coupon";
import { adminCouponService } from "@/entities/coupon/admin-service";
import {
  CouponEditor,
  CouponTable,
  CouponToolbar,
  emptyCouponValues,
  parseCouponListParams,
  parseCouponModal,
  toCouponFormValues,
  type CouponEditorProps,
  type CouponModalState,
} from "@/features/admin/coupons";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Mã giảm giá" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Không có API chi tiết (✅Q-CP5): sửa lấy dòng trên trang đang xem; không thấy → "missing". */
function editorProps(modal: CouponModalState | null, rows: readonly AdminCoupon[]): CouponEditorProps | null {
  if (!modal) return null;
  if (modal.mode === "create") return { mode: "create", initialValues: emptyCouponValues() };
  const coupon = rows.find((c) => c.id === modal.id);
  if (!coupon) return { mode: "missing" };
  return { mode: "edit", couponId: coupon.id, usedCount: coupon.used_count, initialValues: toCouponFormValues(coupon) };
}

export default async function AdminCouponsPage({ searchParams }: Props) {
  await requirePermission("coupon:manage");

  const sp = await searchParams;
  const query = parseCouponListParams(sp);
  const list = await adminCouponService.list(query);
  const editor = editorProps(parseCouponModal(sp), list.items);
  // Mốc thời gian chung cho nhãn trạng thái (server + client cùng một giá trị → không lệch hydration)
  const now = new Date().toISOString();

  return (
    <>
      <CouponToolbar />
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <CouponTable items={list.items} total={list.total} page={query.page} pageSize={query.limit} now={now} />
      </Card>
      {editor && <CouponEditor key={editor.mode === "edit" ? `edit-${editor.couponId}` : editor.mode} {...editor} />}
    </>
  );
}
