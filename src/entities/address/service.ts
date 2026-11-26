import "server-only";
import { ApiError, apiFetch } from "@/lib/api/http";
import type { Address } from "./types";

// FDD 1.2.2 — Sổ địa chỉ của CHÍNH người đang đăng nhập: gateway gắn danh tính từ cookie phiên,
// web không gửi userId (mục 10.3 lớp 4). Gọi `GET /api/users/me/addresses[/:id]` của identity-service.

/** Body backend: `recipient_name`/`phone_number` có thể thiếu; backend chưa có nhãn địa chỉ. */
interface RawAddress {
  id: string;
  full_address: string;
  recipient_name: string | null;
  phone_number: string | null;
  is_default: boolean;
}

const toAddress = (raw: RawAddress): Address => ({
  id: raw.id,
  label: null,
  recipient_name: raw.recipient_name ?? "",
  phone_number: raw.phone_number ?? "",
  full_address: raw.full_address,
  is_default: raw.is_default,
});

export const addressService = {
  /** Địa chỉ mặc định đứng đầu. */
  async listMine(): Promise<Address[]> {
    const raw = await apiFetch<RawAddress[]>("/api/users/me/addresses");
    return raw.map(toAddress).sort((a, b) => Number(b.is_default) - Number(a.is_default));
  },

  /** `null` khi id không thuộc sổ địa chỉ của người đang đăng nhập (404) hoặc sai định dạng (400). */
  async getMine(id: string): Promise<Address | null> {
    try {
      return toAddress(await apiFetch<RawAddress>(`/api/users/me/addresses/${encodeURIComponent(id)}`));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
      throw err;
    }
  },
};
