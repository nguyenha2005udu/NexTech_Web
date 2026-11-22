"use client";

// FDD 1.2.1 — Cập nhật thông tin cá nhân + hồ sơ mua sắm
import { useTransition } from "react";
import { App, Button, Form, Input, Select } from "antd";
import { zodRule } from "@/lib/zod-rule";
import type { MyProfile } from "@/entities/user";
import { updateProfile } from "../actions";
import { fullNameSchema, phoneSchema, type ProfileFormInput } from "../schemas";
import styles from "./profile.module.css";

const SEGMENT_OPTIONS = ["Sinh viên", "Người đi làm", "Phụ huynh", "Khác"].map((v) => ({ value: v }));
const AGE_OPTIONS = ["Dưới 18", "18-22", "23-30", "31-40", "Trên 40"].map((v) => ({ value: v }));

export function ProfileForm({ profile }: { profile: MyProfile }) {
  const { account, shopping } = profile;
  const [form] = Form.useForm();
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  function onFinish(values: ProfileFormInput) {
    startTransition(async () => {
      const result = await updateProfile(values);
      if (result.ok) {
        message.success("Đã cập nhật hồ sơ");
        return;
      }
      const fields = Object.entries(result.fieldErrors ?? {});
      if (fields.length) form.setFields(fields.map(([name, errors]) => ({ name, errors: [errors] })));
      else message.warning(result.message);
    });
  }

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{
        fullName: account.full_name,
        phone: account.phone_number ?? "",
        userSegment: shopping.user_segment ?? undefined,
        occupation: shopping.occupation ?? "",
        ageRange: shopping.age_range ?? undefined,
        interests: shopping.interests,
      }}
      onFinish={onFinish}
    >
      <section className={styles.card} aria-labelledby="profile-account">
        <h2 id="profile-account" className={styles.cardTitle}>Thông tin tài khoản</h2>
        <div className={styles.grid}>
          <Form.Item name="fullName" label="Họ và tên" rules={[zodRule(fullNameSchema)]} validateTrigger="onBlur">
            <Input size="large" autoComplete="name" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[zodRule(phoneSchema)]} validateTrigger="onBlur">
            <Input size="large" inputMode="tel" autoComplete="tel" placeholder="0901234567" />
          </Form.Item>
          <Form.Item label="Email" className={styles.full} extra="Email dùng để đăng nhập, không đổi được.">
            <Input size="large" value={account.email} readOnly disabled aria-label="Email" />
          </Form.Item>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="profile-shopping" style={{ marginTop: 24 }}>
        <h2 id="profile-shopping" className={styles.cardTitle}>Hồ sơ mua sắm</h2>
        <div className={styles.grid}>
          <Form.Item name="userSegment" label="Bạn là">
            <Select size="large" allowClear placeholder="Chọn đối tượng" options={SEGMENT_OPTIONS} />
          </Form.Item>
          <Form.Item name="ageRange" label="Độ tuổi">
            <Select size="large" allowClear placeholder="Chọn độ tuổi" options={AGE_OPTIONS} />
          </Form.Item>
          <Form.Item name="occupation" label="Nghề nghiệp / ngành học" className={styles.full}>
            <Input size="large" maxLength={100} placeholder="Ví dụ: Công nghệ thông tin" />
          </Form.Item>
          <Form.Item
            name="interests"
            label="Sở thích"
            className={styles.full}
            extra="Trợ lý AI dùng các thông tin này để gợi ý sản phẩm phù hợp."
          >
            <Select size="large" mode="tags" tokenSeparators={[","]} open={false} placeholder="Nhập rồi nhấn Enter" />
          </Form.Item>
        </div>
      </section>

      <div className={styles.actions} style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" size="large" loading={pending}>
          Lưu thay đổi
        </Button>
      </div>
    </Form>
  );
}
