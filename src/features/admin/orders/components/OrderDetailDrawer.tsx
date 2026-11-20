"use client";

// FDD 8.2.2 — Drawer chi tiết đơn (design/admin/04 §2, ảnh 07). Mở theo ?view=<id>; đóng = bỏ ?view.
// Thiếu thông tin người nhận / ảnh SP (BE-4) → hiện "—" / ô giữ chỗ (✅Q-O3).
import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import { App, Divider, Drawer, Tag } from "antd";
import { orderStatusMeta, type AdminOrderDetail, type AdminOrderLine } from "@/entities/order";
import { PAYMENT_METHOD_META, isPaymentMethod } from "@/entities/transaction";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatDateTime, formatOrderCode, formatVND } from "@/lib/format";
import { OrderStatusUpdater } from "./OrderStatusUpdater";
import { OrderTimeline } from "./OrderTimeline";
import styles from "./orders.module.css";

const DASH = "—";

function Section({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <section className={styles.section} aria-label={label}>
      <h3 className={styles.sectionLabel}>{label}</h3>
      {children}
    </section>
  );
}

function SummaryRow({ label, children }: Readonly<{ label: ReactNode; children: ReactNode }>) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.muted}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

function LineItem({ line }: Readonly<{ line: AdminOrderLine }>) {
  const { product, quantity, product_image } = line;
  return (
    <li className={styles.line}>
      {product_image ? (
        // URL ảnh Cloudinary / do admin dán — không qua Image Optimization nên không cần remotePatterns
        <Image src={product_image} alt="" width={40} height={40} unoptimized className={styles.lineImage} />
      ) : (
        <span className={styles.lineImagePlaceholder} aria-hidden="true" />
      )}
      <span className={styles.section}>
        <span className={styles.lineName} title={product.name}>
          {product.name}
        </span>
        <span className={`${styles.muted} ${styles.small}`}>
          {formatVND(product.price)} × {quantity}
        </span>
      </span>
      <span className={styles.money}>{formatVND(product.price * quantity)}</span>
    </li>
  );
}

function OrderDetailBody({ order }: Readonly<{ order: AdminOrderDetail }>) {
  const status = orderStatusMeta(order.status);
  const method = order.payment && isPaymentMethod(order.payment.method) ? order.payment.method : null;
  const recipient = [order.shipping_recipient_name ?? DASH, order.shipping_phone_number ?? DASH].join(" · ");

  return (
    <>
      <Section label="Khách hàng">
        <span className={styles.strong}>{order.user.full_name ?? DASH}</span>
        <span className={styles.muted}>{order.user.email ?? DASH}</span>
      </Section>
      <Divider className={styles.divider} />

      <Section label="Người nhận">
        <span>{recipient}</span>
        <span className={styles.muted}>{order.shipping_full_address ?? DASH}</span>
      </Section>
      <Divider className={styles.divider} />

      <Section label="Sản phẩm">
        {order.items.length > 0 ? (
          <ul className={styles.lines}>
            {order.items.map((line, index) => (
              // Danh sách chỉ đọc, không sắp xếp; ghép vị trí vì một đơn có thể có 2 dòng cùng sản phẩm
              <LineItem key={`${line.product.id}-${index}`} line={line} />
            ))}
          </ul>
        ) : (
          <span className={styles.muted}>Không có sản phẩm</span>
        )}
      </Section>
      <Divider className={styles.divider} />

      <Section label="Tóm tắt thanh toán">
        <SummaryRow label="Tạm tính">{formatVND(order.subtotal)}</SummaryRow>
        <SummaryRow label="Phí vận chuyển">
          {order.shipping_fee === 0 ? "Miễn phí" : formatVND(order.shipping_fee)}
        </SummaryRow>
        {order.discount_amount > 0 && (
          <SummaryRow label="Giảm giá">
            <span className={styles.discount}>−{formatVND(order.discount_amount)}</span>
          </SummaryRow>
        )}
        <SummaryRow label="Phương thức">{method ? PAYMENT_METHOD_META[method].longLabel : DASH}</SummaryRow>
        <Divider className={styles.divider} />
        <div className={styles.summaryRow}>
          <span className={styles.totalLabel}>Tổng cộng</span>
          <span className={styles.totalValue}>{formatVND(order.total)}</span>
        </div>
        <SummaryRow label="Trạng thái">
          <Tag color={status.color} variant="solid">
            {status.label}
          </Tag>
        </SummaryRow>
        <SummaryRow label="Ngày đặt">{formatDateTime(order.created_at)}</SummaryRow>
        {order.note && <p className={styles.note}>Ghi chú: {order.note}</p>}
      </Section>
      <Divider className={styles.divider} />

      <Section label="Tiến trình đơn hàng">
        <OrderTimeline status={order.status} payment={order.payment} />
        {/* key theo trạng thái: lưu xong → Select về trạng thái mới */}
        <OrderStatusUpdater key={order.status} orderId={order.id} status={order.status} paymentMethod={method} />
      </Section>
    </>
  );
}

export interface OrderDetailDrawerProps {
  /** `null` khi không có ?view hoặc không tìm thấy đơn. */
  order: AdminOrderDetail | null;
  /** URL có ?view hợp lệ nhưng backend trả 404 → báo "Không tìm thấy đơn hàng" rồi bỏ ?view. */
  notFound?: boolean;
}

export function OrderDetailDrawer({ order, notFound = false }: Readonly<OrderDetailDrawerProps>) {
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();

  useEffect(() => {
    if (!notFound) return;
    message.warning("Không tìm thấy đơn hàng");
    setParams({ view: undefined });
  }, [notFound, message, setParams]);

  if (!order) return null;

  return (
    <Drawer
      open
      placement="right"
      size={380}
      title={`Đơn ${formatOrderCode(order.id)}`}
      onClose={() => setParams({ view: undefined })}
      destroyOnHidden
    >
      <OrderDetailBody order={order} />
    </Drawer>
  );
}
