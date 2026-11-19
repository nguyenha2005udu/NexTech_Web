import { Card, Skeleton } from "antd";

// Khung chờ chung cho các trang admin: thanh công cụ + bảng.
export default function AdminLoading() {
  return (
    <Card variant="borderless" aria-busy="true" aria-label="Đang tải dữ liệu">
      <Skeleton.Input active size="small" style={{ width: 260, marginBottom: 16 }} />
      <Skeleton active title={false} paragraph={{ rows: 8 }} />
    </Card>
  );
}
