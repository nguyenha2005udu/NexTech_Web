"use client";

// FDD 1.2.2 — Form thêm / sửa địa chỉ trong hộp thoại. `address` có → sửa; không có → thêm.
import { useEffect, useTransition } from "react";
import { App, Checkbox, Form, Input, Modal } from "antd";
import type { Address } from "@/entities/address";
import { zodRule } from "@/lib/zod-rule";
import { createAddress, updateAddress } from "../actions";
import { fullAddressSchema, phoneNumberSchema, recipientNameSchema, type AddressFormInput } from "../schemas";
interface Props {
  open: boolean;
  address: Address | null;
  onClose: () => void;
}

export function AddressFormModal({ open, address, onClose }: Props) {
  const [form] = Form.useForm();
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  // Mở hộp → nạp lại giá trị (thêm: trống; sửa: địa chỉ đang chọn).
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      recipientName: address?.recipient_name ?? "",
      phoneNumber: address?.phone_number ?? "",
      fullAddress: address?.full_address ?? "",
      isDefault: address?.is_default ?? false,
    });
  }, [open, address, form]);

  function onFinish(values: AddressFormInput) {
    startTransition(async () => {
      const result = address ? await updateAddress(address.id, values) : await createAddress(values);
      if (result.ok) {
        message.success(address ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ");
        onClose();
        return;
      }
      const fields = Object.entries(result.fieldErrors ?? {});
      if (fields.length) form.setFields(fields.map(([name, errors]) => ({ name, errors: [errors] })));
      else message.warning(result.message);
    });
  }

  return (
    <Modal
      open={open}
      title={address ? "Sửa địa chỉ" : "Thêm địa chỉ"}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={pending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
        <Form.Item name="recipientName" label="Người nhận" rules={[zodRule(recipientNameSchema)]} validateTrigger="onBlur">
          <Input size="large" autoComplete="name" />
        </Form.Item>
        <Form.Item name="phoneNumber" label="Số điện thoại" rules={[zodRule(phoneNumberSchema)]} validateTrigger="onBlur">
          <Input size="large" inputMode="tel" autoComplete="tel" placeholder="0901234567" />
        </Form.Item>
        <Form.Item name="fullAddress" label="Địa chỉ" rules={[zodRule(fullAddressSchema)]} validateTrigger="onBlur">
          <Input.TextArea rows={3} maxLength={255} autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
        </Form.Item>
        <Form.Item name="isDefault" valuePropName="checked">
          <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
