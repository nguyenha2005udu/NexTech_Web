"use client";

// Lỗi khi tải trang admin (Next 16: prop `retry`, không còn `reset`).
import { useEffect } from "react";
import { Button, Card, Result } from "antd";

export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card variant="borderless">
      <Result
        status="error"
        title="Không tải được dữ liệu"
        subTitle="Máy chủ đang gặp sự cố, vui lòng thử lại sau ít phút."
        extra={
          <Button type="primary" onClick={() => retry()}>
            Thử lại
          </Button>
        }
      />
    </Card>
  );
}
