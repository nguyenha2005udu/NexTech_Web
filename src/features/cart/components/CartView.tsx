"use client";

// FDD 4.1 — Trang giỏ hàng (Figma 03.01 có hàng, 03.02 giỏ trống, 03.03 khách bấm đặt hàng).
// CSR theo mục 5: giỏ của khách nằm ở client (Redux + localStorage).
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Modal } from "antd";
import { ArrowRightIcon, ShoppingBagIcon, UserIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useCartRefresh } from "../hooks/useCartRefresh";
import { useSignedIn } from "../hooks/useSignedIn";
import { setAllSelected } from "../model/cartSlice";
import {
  selectCartHydrated,
  selectCartItems,
  selectIsAllSelected,
  selectSelectedItems,
  selectSelectedSubtotal,
} from "../model/selectors";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";
import styles from "./CartPage.module.css";

export function CartView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const items = useAppSelector(selectCartItems);
  const hydrated = useAppSelector(selectCartHydrated);
  const selectedItems = useAppSelector(selectSelectedItems);
  const subtotal = useAppSelector(selectSelectedSubtotal);
  const allSelected = useAppSelector(selectIsAllSelected);
  const signedIn = useSignedIn();
  useCartRefresh();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  // Chưa đọc xong localStorage: chưa biết giỏ có gì, không hiện "giỏ trống" rồi nháy sang danh sách.
  if (!hydrated) return <div className={styles.skeleton} aria-busy="true" aria-label="Đang tải giỏ hàng" />;

  if (!items.length) {
    return (
      <>
        <p className={styles.description}>Giỏ của bạn đang trống.</p>
        <section className={styles.empty} aria-labelledby="cart-empty-title">
          <ShoppingBagIcon size={28} />
          <h2 id="cart-empty-title" className={styles.emptyTitle}>
            Chưa có sản phẩm trong giỏ
          </h2>
          <p className={styles.emptyText}>Khám phá các thiết bị và thêm món bạn quan tâm.</p>
          <Link href={routes.search} className={styles.primaryLink}>
            <ArrowRightIcon /> Khám phá sản phẩm
          </Link>
        </section>
      </>
    );
  }

  function checkout() {
    // Đã biết là khách → giải thích trước (03.03). Chưa biết → cứ đi tiếp, proxy chặn /checkout nếu cần.
    if (signedIn === false) setLoginPromptOpen(true);
    else router.push(routes.checkout);
  }

  return (
    <>
      <p className={styles.description}>Chọn sản phẩm bạn muốn mua và kiểm tra số lượng.</p>
      <div className={styles.layout}>
        <section className={styles.card} aria-label="Sản phẩm trong giỏ">
          {signedIn === false ? (
            <p className={styles.notice}>Giỏ hàng được lưu trên trình duyệt này. Bạn sẽ cần đăng nhập để đặt hàng.</p>
          ) : null}
          <div className={styles.listHeader}>
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && selectedItems.length > 0}
              onChange={(e) => dispatch(setAllSelected(e.target.checked))}
            >
              Chọn tất cả ({items.length})
            </Checkbox>
            <span aria-live="polite">Đã chọn {selectedItems.length} sản phẩm</span>
          </div>
          <ul className={styles.list}>
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </ul>
        </section>

        <CartSummary subtotal={subtotal} selectedCount={selectedItems.length} onCheckout={checkout} />

        <Modal
          open={loginPromptOpen}
          title="Đăng nhập để đặt hàng"
          onCancel={() => setLoginPromptOpen(false)}
          centered
          footer={[
            <Button key="stay" onClick={() => setLoginPromptOpen(false)}>
              Tiếp tục xem giỏ
            </Button>,
            <Button
              key="login"
              type="primary"
              icon={<UserIcon />}
              onClick={() => router.push(routes.loginWithCallback(routes.checkout))}
            >
              Đăng nhập
            </Button>,
          ]}
        >
          <p>
            Đăng nhập để nhập địa chỉ giao hàng và chọn phương thức thanh toán. Giỏ hàng hiện tại sẽ được giữ khi bạn
            đăng nhập.
          </p>
        </Modal>
      </div>
    </>
  );
}
