"use client";

// FDD 5.2.4 — Nút "Viết đánh giá" ở từng sản phẩm trong chi tiết đơn, mở hộp thoại chọn sao + nội dung.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Input, Modal, Rate } from "antd";
import { REVIEW_CONTENT_MAX } from "@/entities/review";
import { createReview } from "../actions";
import { ALREADY_REVIEWED_FIELD } from "../review-errors";
import styles from "./Review.module.css";

type Props = { orderId: string; productId: string; productName: string };

export function ReviewButton({ orderId, productId, productName }: Props) {
  const { message } = App.useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState(false);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setErrors({});
  }

  function submit() {
    startTransition(async () => {
      const result = await createReview({ orderId, productId, rating, content });
      if (!result.ok) {
        if (result.fieldErrors?.[ALREADY_REVIEWED_FIELD]) {
          // Đã đánh giá từ trước (backend chưa có API cho biết trước): đổi nút, không bắt viết lại.
          message.info(result.message);
          close();
          setReviewed(true);
          return;
        }
        setErrors(result.fieldErrors ?? { form: result.message });
        return;
      }
      message.success("Cảm ơn bạn đã đánh giá sản phẩm");
      close();
      setReviewed(true);
      router.refresh();
    });
  }

  // Nút trong chi tiết đơn không biết sản phẩm đã được đánh giá chưa (backend không có API): sau khi viết xong
  // (hoặc backend báo đã đánh giá) thì thay bằng nhãn, tránh mở lại hộp thoại còn nguyên nội dung cũ.
  if (reviewed) return <span className={styles.reviewed}>Đã đánh giá</span>;

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        Viết đánh giá
      </Button>
      <Modal
        open={open}
        title={`Đánh giá ${productName}`}
        okText="Gửi đánh giá"
        cancelText="Hủy"
        confirmLoading={pending}
        onOk={submit}
        onCancel={close}
        destroyOnHidden
      >
        <div className={styles.field}>
          <span id="review-rating-label" className={styles.label}>
            Chất lượng sản phẩm
          </span>
          <Rate value={rating} onChange={setRating} aria-labelledby="review-rating-label" />
          {errors.rating ? (
            <p role="alert" className={styles.error}>
              {errors.rating}
            </p>
          ) : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="review-content" className={styles.label}>
            Nội dung đánh giá
          </label>
          <Input.TextArea
            id="review-content"
            rows={4}
            maxLength={REVIEW_CONTENT_MAX}
            showCount
            value={content}
            onChange={(e) => setContent(e.target.value)}
            status={errors.content ? "error" : undefined}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm"
          />
          {errors.content ? (
            <p role="alert" className={styles.error}>
              {errors.content}
            </p>
          ) : null}
        </div>
        {errors.form ? (
          <p role="alert" className={styles.error}>
            {errors.form}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
