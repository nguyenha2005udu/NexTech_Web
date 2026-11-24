import type { Address } from "./types";

// Dữ liệu minh hoạ theo Figma 03.04–03.05. Thay bằng API backend khi có hợp đồng.
export const mockAddresses: Address[] = [
  {
    id: "addr-home",
    label: "Nhà riêng",
    recipient_name: "Minh Anh",
    phone_number: "090 000 0000",
    full_address: "123 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh",
    is_default: true,
  },
  {
    id: "addr-office",
    label: "Văn phòng",
    recipient_name: "Minh Anh",
    phone_number: "090 000 0000",
    full_address: "45 Điện Biên Phủ, TP. Hồ Chí Minh",
    is_default: false,
  },
];
