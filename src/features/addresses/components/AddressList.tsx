"use client";

// FDD 1.2.2 — Sổ địa chỉ: thêm, sửa, đặt mặc định, xoá.
import { useState, useTransition } from "react";
import { App, Button, Tag } from "antd";
import type { Address } from "@/entities/address";
import { deleteAddress, setDefaultAddress } from "../actions";
import { AddressFormModal } from "./AddressFormModal";
import styles from "./addresses.module.css";

type Editing = { address: Address | null } | null;

export function AddressList({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [pending, startTransition] = useTransition();
  const { message, modal } = App.useApp();

  function run(action: () => ReturnType<typeof deleteAddress>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) message.success(success);
      else message.warning(result.message);
    });
  }

  function confirmDelete(address: Address) {
    modal.confirm({
      title: "Xoá địa chỉ này?",
      content: address.full_address,
      okText: "Xoá",
      cancelText: "Huỷ",
      okButtonProps: { danger: true },
      onOk: () => run(() => deleteAddress(address.id), "Đã xoá địa chỉ"),
    });
  }

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Địa chỉ giao hàng</h1>
          <p className={styles.subtitle}>Địa chỉ mặc định được chọn sẵn khi bạn thanh toán.</p>
        </div>
        <Button type="primary" size="large" onClick={() => setEditing({ address: null })}>
          Thêm địa chỉ
        </Button>
      </div>

      {addresses.length ? (
        <ul className={styles.list}>
          {addresses.map((a) => (
            <li key={a.id} className={styles.card}>
              <p className={styles.name}>
                {a.recipient_name}
                <span className={styles.phone}>{a.phone_number}</span>{" "}
                {a.is_default ? <Tag color="blue">Mặc định</Tag> : null}
              </p>
              <p className={styles.address}>{a.full_address}</p>
              <div className={styles.actions}>
                <Button size="small" onClick={() => setEditing({ address: a })}>
                  Sửa
                </Button>
                {a.is_default ? null : (
                  <Button size="small" disabled={pending} onClick={() => run(() => setDefaultAddress(a.id), "Đã đặt làm mặc định")}>
                    Đặt làm mặc định
                  </Button>
                )}
                <Button size="small" danger disabled={pending} onClick={() => confirmDelete(a)}>
                  Xoá
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Bạn chưa có địa chỉ giao hàng nào.</p>
      )}

      <AddressFormModal open={editing !== null} address={editing?.address ?? null} onClose={() => setEditing(null)} />
    </>
  );
}
