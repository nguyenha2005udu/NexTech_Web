"use client";

// FDD 8.3 — Modal Thêm / Sửa mã giảm giá (design/admin/05 §2, ảnh 09). Chỉ hiển thị + validate; gửi ở CouponEditor.
// Thêm so với mockup: "Áp dụng cho" (✅Q-CP3), "Giảm tối đa" khi loại % và "Thời gian hiệu lực" dạng khoảng (✅Q-CP4).
import dayjs, { type Dayjs } from "dayjs";
import { Checkbox, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import type { FormInstance, FormRule } from "antd";
import { COUPON_CATEGORY_LABEL } from "@/entities/coupon";
import { formatNumber } from "@/lib/format";
import { zodRule } from "@/lib/zod-rule";
import { clearedDateError, usageLimitError, type CouponFormValues } from "../coupon.rules";
import {
  couponCodeSchema,
  couponDescriptionSchema,
  couponDiscountValueSchema,
  couponMaxDiscountSchema,
  couponMinOrderSchema,
  couponUsageLimitSchema,
} from "../schemas";
import styles from "./coupons.module.css";

type DateRange = [Dayjs | null, Dayjs | null] | null;

/** Giá trị trong antd Form: ngày ở dạng Dayjs của RangePicker. */
export type CouponFormFields = Omit<CouponFormValues, "validFrom" | "validUntil"> & { validRange?: DateRange };

const DATE = "YYYY-MM-DD";

export function toFormFields({ validFrom, validUntil, ...rest }: CouponFormValues): CouponFormFields {
  const range: DateRange = validFrom || validUntil ? [validFrom ? dayjs(validFrom) : null, validUntil ? dayjs(validUntil) : null] : null;
  return { ...rest, validRange: range };
}

export function fromFormFields({ validRange, ...rest }: CouponFormFields): CouponFormValues {
  return {
    ...rest,
    validFrom: validRange?.[0]?.format(DATE) ?? undefined,
    validUntil: validRange?.[1]?.format(DATE) ?? undefined,
  };
}

const CATEGORY_OPTIONS = Object.entries(COUPON_CATEGORY_LABEL).map(([value, label]) => ({ value, label }));
const TYPE_OPTIONS = [
  { value: "percent", label: "Phần trăm (%)" },
  { value: "fixed_amount", label: "Số tiền (₫)" },
];

/** Ô tiền: hiện dấu chấm nghìn; xoá trắng → chuỗi rỗng → antd đặt giá trị `null`. */
const moneyProps = {
  min: 0,
  precision: 0,
  suffix: "₫",
  formatter: (value: number | string | undefined) =>
    value === undefined || value === null || `${value}` === "" ? "" : formatNumber(Number(value)),
  parser: (value: string | undefined) => value?.replace(/\D/g, "") ?? "",
} as const;

const upper = (value: string | undefined) => value?.toUpperCase();

export interface CouponFormModalProps {
  form: FormInstance<CouponFormFields>;
  mode: "create" | "edit";
  initialValues: CouponFormValues;
  /** Sửa: số lượt đã dùng (giới hạn lượt không được nhỏ hơn). */
  usedCount?: number;
  pending: boolean;
  onSubmit: (values: CouponFormValues) => void;
  onClose: () => void;
}

export function CouponFormModal({
  form,
  mode,
  initialValues,
  usedCount = 0,
  pending,
  onSubmit,
  onClose,
}: Readonly<CouponFormModalProps>) {
  const discountType = Form.useWatch("discountType", form) ?? initialValues.discountType;
  const isPercent = discountType === "percent";

  const discountValueRule: FormRule = ({ getFieldValue }) => ({
    validator: async (_rule, value: unknown) => {
      const base = couponDiscountValueSchema.safeParse(value);
      if (!base.success) throw new Error(base.error.issues[0]?.message);
      if (getFieldValue("discountType") === "percent" && base.data > 100) throw new Error("Phần trăm tối đa 100");
      if (getFieldValue("discountType") === "fixed_amount" && !Number.isInteger(base.data)) {
        throw new Error("Số tiền phải là số nguyên");
      }
    },
  });

  const rangeRule: FormRule = {
    validator: async (_rule, value: DateRange | undefined) => {
      const next = { validFrom: value?.[0]?.format(DATE), validUntil: value?.[1]?.format(DATE) };
      const error = mode === "edit" ? clearedDateError(initialValues, next) : null;
      if (error) throw new Error(error);
    },
  };

  const usageRule: FormRule = {
    validator: async (_rule, value: number | null | undefined) => {
      const error = mode === "edit" ? usageLimitError(value, usedCount) : null;
      if (error) throw new Error(error);
    },
  };

  return (
    <Modal
      open
      title={mode === "create" ? "Thêm mã giảm giá" : "Sửa mã giảm giá"}
      width={480}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={pending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form<CouponFormFields>
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={toFormFields(initialValues)}
        onFinish={(fields) => onSubmit(fromFormFields(fields))}
        onValuesChange={(changed: Partial<CouponFormFields>) => {
          // Loại ₫ không có "Giảm tối đa"
          if (changed.discountType === "fixed_amount") form.setFieldValue("maxDiscount", null);
        }}
      >
        <Form.Item name="code" label="Mã" normalize={upper} rules={mode === "create" ? [zodRule(couponCodeSchema)] : []}>
          <Input placeholder="VD: SALE10" maxLength={50} disabled={mode === "edit"} autoFocus={mode === "create"} />
        </Form.Item>
        <Form.Item name="description" label="Mô tả" rules={[zodRule(couponDescriptionSchema)]}>
          <Input placeholder="Mô tả ngắn" maxLength={255} />
        </Form.Item>
        <Form.Item name="category" label="Áp dụng cho">
          <Select options={CATEGORY_OPTIONS} />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="discountType" label="Loại giảm">
              <Select options={TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="discountValue" label="Giá trị" dependencies={["discountType"]} rules={[discountValueRule]}>
              {isPercent ? (
                <InputNumber<number> min={0} max={100} suffix="%" className={styles.fullWidth} />
              ) : (
                <InputNumber {...moneyProps} className={styles.fullWidth} />
              )}
            </Form.Item>
          </Col>
        </Row>
        {isPercent && (
          <Form.Item name="maxDiscount" label="Giảm tối đa (không bắt buộc)" rules={[zodRule(couponMaxDiscountSchema)]}>
            <InputNumber {...moneyProps} placeholder="Không giới hạn" className={styles.fullWidth} />
          </Form.Item>
        )}
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="minOrderValue" label="Đơn tối thiểu" rules={[zodRule(couponMinOrderSchema)]}>
              <InputNumber {...moneyProps} className={styles.fullWidth} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="usageLimit" label="Giới hạn lượt" rules={[zodRule(couponUsageLimitSchema), usageRule]}>
              <InputNumber<number> min={1} precision={0} placeholder="Không giới hạn" className={styles.fullWidth} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="validRange" label="Thời gian hiệu lực" rules={[rangeRule]}>
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            allowEmpty={[true, true]}
            placeholder={["Từ ngày", "Đến ngày"]}
            className={styles.fullWidth}
            disabledDate={mode === "create" ? (current) => current.isBefore(dayjs().startOf("day")) : undefined}
          />
        </Form.Item>
        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Kích hoạt</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
