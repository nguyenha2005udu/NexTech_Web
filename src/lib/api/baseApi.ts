// Mục 7.1, 7.2 — RTK Query cho dữ liệu server cần refetch phía client (thông báo 6.2, cảnh báo giá 6.1…).
// Trình duyệt chỉ gọi Route Handler cùng domain (`/api/...`): Route Handler dùng apiFetch() ở server để
// tới API Gateway, nên cookie phiên httpOnly không bao giờ lộ ra JS phía client (mục 10.1).
// Feature thêm endpoint bằng `baseApi.injectEndpoints({ endpoints: (build) => ({ ... }) })`.
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "same-origin" }),
  tagTypes: ["Notification", "PriceAlert", "Cart"],
  endpoints: () => ({}),
});
