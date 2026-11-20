"use client";

// FDD 8.3 — Nối Modal với Server Action và URL (design/admin/05 §2.3): Lưu → saveCoupon → đóng (bỏ ?modal).
// Sửa mà không thấy mã trên trang đang xem (✅Q-CP5: không có API chi tiết) → báo lỗi và bỏ ?modal.
import { useEffect } from "react";
import { App, Form } from "antd";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { useFormAction } from "@/hooks/useFormAction";
import { saveCoupon } from "../actions";
import type { CouponFormValues } from "../coupon.rules";
import { CouponFormModal, type CouponFormFields } from "./CouponFormModal";

export type CouponEditorProps =
  | { mode: "create"; initialValues: CouponFormValues }
  | { mode: "edit"; couponId: string; usedCount: number; initialValues: CouponFormValues }
  | { mode: "missing" };

export function CouponEditor(props: Readonly<CouponEditorProps>) {
  const [form] = Form.useForm<CouponFormFields>();
  const { pending, run } = useFormAction(form);
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();
  const missing = props.mode === "missing";

  const close = () => setParams({ modal: undefined, id: undefined });

  useEffect(() => {
    if (!missing) return;
    message.warning("Không tìm thấy mã giảm giá");
    setParams({ modal: undefined, id: undefined });
  }, [missing, message, setParams]);

  if (props.mode === "missing") return null;

  const couponId = props.mode === "edit" ? props.couponId : null;

  return (
    <CouponFormModal
      form={form}
      mode={props.mode}
      initialValues={props.initialValues}
      usedCount={props.mode === "edit" ? props.usedCount : 0}
      pending={pending}
      onClose={close}
      onSubmit={(values) =>
        run(
          () => saveCoupon(couponId, values),
          () => {
            message.success("Đã lưu mã giảm giá");
            close();
          },
        )
      }
    />
  );
}
