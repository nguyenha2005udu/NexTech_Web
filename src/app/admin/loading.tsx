import { Card, Skeleton } from "antd";

// Khung chờ chung cho các trang admin: thanh công cụ + bảng.
// Server Component: không dùng `Skeleton.Input` — thuộc tính tĩnh của client component là undefined qua RSC.
export default function AdminLoading() {
  return (
    <Card variant="borderless" aria-busy="true" aria-label="Đang tải dữ liệu">
      <Skeleton active title={{ width: 260 }} paragraph={false} style={{ marginBottom: 16 }} />
      <Skeleton active title={false} paragraph={{ rows: 8 }} />
    </Card>
  );
}
