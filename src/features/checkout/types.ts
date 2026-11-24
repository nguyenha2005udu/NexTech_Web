// Một dòng ở trang đặt hàng — cùng hình dạng với dòng giỏ hàng (CartItem) để dùng được cả hai nguồn:
// giỏ (Redux) và "Mua ngay" (server đọc ?buyNow=). Giá ở đây chỉ để hiển thị.
export interface CheckoutLine {
  productId: string;
  name: string;
  summary: string;
  imageSrc?: string;
  price: number;
  quantity: number;
}
