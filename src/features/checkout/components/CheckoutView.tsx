"use client";

// FDD 4.2 + 5.1.1 — Trang đặt hàng (Figma 03.04 COD, 03.05 địa chỉ, 03.06 mã giảm giá, 03.07 PayOS).
// Sản phẩm: "Mua ngay" (server đọc ?buyNow= và truyền vào) hoặc các dòng đang chọn trong giỏ (Redux).
// Số tiền hiển thị tính ở client; placeOrder tính lại ở server (mục 5).
import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Button } from "antd";
import { MapPinIcon, TagIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import type { Address } from "@/entities/address";
import type { Coupon } from "@/entities/coupon";
import type { PaymentMethod } from "@/entities/transaction";
import { removeItem, selectCartHydrated, selectSelectedItems } from "@/features/cart";
import { formatVND } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { placeOrder } from "../actions";
import { priceOrder } from "../pricing";
import type { CheckoutLine } from "../types";
import { AddressPicker } from "./AddressPicker";
import { CouponPicker } from "./CouponPicker";
import { OrderSummary } from "./OrderSummary";
import { PaymentMethodSelect } from "./PaymentMethodSelect";
import styles from "./Checkout.module.css";

type Props = {
  addresses: Address[];
  coupons: Coupon[];
  /** Có khi vào từ "Mua ngay" — khi đó KHÔNG lấy giỏ hàng */
  buyNow: CheckoutLine | null;
};

export function CheckoutView({ addresses, coupons, buyNow }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { message } = App.useApp();
  const cartLines = useAppSelector(selectSelectedItems);
  const cartHydrated = useAppSelector(selectCartHydrated);

  const [addressId, setAddressId] = useState<string | null>(addresses[0]?.id ?? null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [picker, setPicker] = useState<"address" | "coupon" | null>(null);
  const [submitting, startSubmit] = useTransition();

  const lines: CheckoutLine[] = buyNow ? [buyNow] : cartLines;
  const address = addresses.find((a) => a.id === addressId) ?? null;
  const coupon = coupons.find((c) => c.code === couponCode) ?? null;
  const pricing = priceOrder(lines, coupon, new Date());

  if (!buyNow && !cartHydrated) {
    return <div className={styles.empty} aria-busy="true" aria-label="Đang tải sản phẩm" />;
  }

  if (!lines.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.strong}>Chưa có sản phẩm nào được chọn để đặt hàng.</p>
        <p className={styles.muted}>
          <Link href={routes.cart} className={styles.link}>
            Quay lại giỏ hàng
          </Link>{" "}
          để chọn sản phẩm.
        </p>
      </div>
    );
  }

  function submit() {
    if (!address) return;
    startSubmit(async () => {
      const result = await placeOrder({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        addressId: address.id,
        couponCode,
        paymentMethod,
      });
      if (!result.ok) {
        message.error(result.message);
        if (result.fieldErrors?.couponCode) setCouponCode(null);
        return;
      }
      // Đặt từ giỏ thì bỏ các dòng đã đặt; "Mua ngay" không đụng tới giỏ.
      if (!buyNow) result.data.productIds.forEach((id) => dispatch(removeItem(id)));
      if (/^https?:\/\//.test(result.data.redirectTo)) window.location.assign(result.data.redirectTo);
      else router.push(result.data.redirectTo);
    });
  }

  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        <section className={styles.card} aria-labelledby="address-title">
          <div className={styles.cardHeader}>
            <h2 id="address-title" className={styles.cardTitle}>
              <MapPinIcon /> Địa chỉ giao hàng
            </h2>
            {addresses.length ? <Button onClick={() => setPicker("address")}>Đổi địa chỉ</Button> : null}
          </div>
          {address ? (
            <>
              <p className={styles.strong}>
                {address.recipient_name} <span className={styles.phone}>{address.phone_number}</span>
              </p>
              <p className={styles.muted}>{address.full_address}</p>
            </>
          ) : (
            <p className={styles.muted}>
              Bạn chưa có địa chỉ giao hàng.{" "}
              <Link href={routes.addresses} className={styles.link}>
                Thêm địa chỉ
              </Link>
            </p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="items-title">
          <h2 id="items-title" className={styles.cardTitle}>
            Sản phẩm đã chọn
          </h2>
          <ul className={styles.items}>
            {lines.map((l) => (
              <li key={l.productId} className={styles.item}>
                <span className={styles.thumb}>
                  {l.imageSrc ? <Image src={l.imageSrc} alt="" width={60} height={34} /> : null}
                </span>
                <div>
                  <p className={styles.strong}>{l.name}</p>
                  <p className={styles.muted}>
                    {l.summary} · SL {l.quantity}
                  </p>
                </div>
                <span className={styles.price}>{formatVND(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="payment-title">
          <h2 id="payment-title" className={styles.cardTitle}>
            Phương thức thanh toán
          </h2>
          <PaymentMethodSelect value={paymentMethod} onChange={setPaymentMethod} />
        </section>

        <section className={styles.card} aria-labelledby="coupon-title">
          <div className={styles.cardHeader}>
            <h2 id="coupon-title" className={styles.cardTitle}>
              <TagIcon /> Mã giảm giá
            </h2>
            <Button onClick={() => setPicker("coupon")}>{coupon ? "Đổi mã" : "Chọn mã"}</Button>
          </div>
          {coupon && !pricing.couponError ? (
            <p className={styles.couponRow}>
              <span className={styles.couponTag}>{coupon.code}</span>
              <span className={styles.muted}>Đã áp dụng giảm {formatVND(pricing.discount)}</span>
            </p>
          ) : coupon ? (
            <p className={styles.error} role="alert">
              {pricing.couponError}
            </p>
          ) : (
            <p className={styles.muted}>Chưa áp dụng mã giảm giá.</p>
          )}
        </section>
      </div>

      <OrderSummary
        pricing={pricing}
        paymentMethod={paymentMethod}
        disabled={!address || pricing.couponError !== null}
        submitting={submitting}
        onSubmit={submit}
      />

      <AddressPicker
        open={picker === "address"}
        addresses={addresses}
        selectedId={addressId}
        onSelect={setAddressId}
        onClose={() => setPicker(null)}
      />
      <CouponPicker
        open={picker === "coupon"}
        coupons={coupons}
        subtotal={pricing.subtotal}
        selectedCode={couponCode}
        onSelect={setCouponCode}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}
