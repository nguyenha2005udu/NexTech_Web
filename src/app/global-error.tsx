"use client";

// Lỗi ở chính root layout — thay luôn <html>, nên không dùng được provider/antd/CSS Module ở đây.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "64px 16px" }}>
        <h1 style={{ fontSize: 24 }}>Đã có lỗi xảy ra</h1>
        <p style={{ margin: "12px 0 24px" }}>Rất tiếc, NexTech tạm thời không tải được. Bạn thử lại nhé.</p>
        <button type="button" onClick={reset} style={{ padding: "10px 20px", fontSize: 16, cursor: "pointer" }}>
          Thử lại
        </button>
      </body>
    </html>
  );
}
