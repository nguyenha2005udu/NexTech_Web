import "server-only";
import { mockAddresses } from "./mock-data";
import type { Address } from "./types";

// FDD 1.2.2 — Sổ địa chỉ của CHÍNH người đang đăng nhập: gateway gắn danh tính từ cookie phiên,
// web không gửi userId (mục 10.3 lớp 4).
// TODO(backend): thay mock bằng apiFetch khi chốt hợp đồng API địa chỉ (giả định kỹ thuật #1).
export const addressService = {
  /** Địa chỉ mặc định đứng đầu. */
  async listMine(): Promise<Address[]> {
    return [...mockAddresses].sort((a, b) => Number(b.is_default) - Number(a.is_default));
  },

  /** `null` khi id không thuộc sổ địa chỉ của người đang đăng nhập. */
  async getMine(id: string): Promise<Address | null> {
    return mockAddresses.find((a) => a.id === id) ?? null;
  },
};
