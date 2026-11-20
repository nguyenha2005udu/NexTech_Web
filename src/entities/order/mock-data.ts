// Dữ liệu mẫu cho test (khớp mockup design/admin/assets/01-dashboard.png).
import type { AdminOrderListItem } from "./types";

export const mockAdminOrders: AdminOrderListItem[] = [
  { id: "a1b2c3d4-0000-4000-8000-000000000001", user_name: "Nguyễn Văn A", product_count: 2, total: 64_980_000, status: "paid", created_at: "2026-07-24T03:24:00.000Z" },
  { id: "e5f6a7b8-0000-4000-8000-000000000002", user_name: "Trần Thị B", product_count: 1, total: 7_990_000, status: "pending", created_at: "2026-07-24T02:10:00.000Z" },
  { id: "c9d0e1f2-0000-4000-8000-000000000003", user_name: "Lê Văn C", product_count: 3, total: 47_280_000, status: "shipped", created_at: "2026-07-23T09:45:00.000Z" },
  { id: "a3b4c5d6-0000-4000-8000-000000000004", user_name: "Phạm Thị D", product_count: 1, total: 2_490_000, status: "cancelled", created_at: "2026-07-23T04:02:00.000Z" },
  { id: "e7f8a9b0-0000-4000-8000-000000000005", user_name: "Đỗ Văn E", product_count: 2, total: 34_480_000, status: "paid", created_at: "2026-07-22T07:30:00.000Z" },
];
