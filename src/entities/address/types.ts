// FDD 1.2.2 / 4.2.1 — Địa chỉ giao hàng của người dùng. Tên trường theo snapshot người nhận ở đơn hàng
// (`shipping_recipient_name`, `shipping_phone_number`, `shipping_full_address` — design/admin/04).
export interface Address {
  id: string;
  /** Nhãn do người dùng đặt ("Nhà riêng", "Văn phòng"); `null` khi không đặt */
  label: string | null;
  recipient_name: string;
  phone_number: string;
  full_address: string;
  is_default: boolean;
}
