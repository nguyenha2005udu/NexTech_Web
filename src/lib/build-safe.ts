// Lúc `next build` (CI, Vercel) backend có thể chưa chạy. Chỉ ở pha build mới nuốt lỗi và dùng giá trị dự phòng
// để build không chết; khi chạy thật (ISR revalidate, request) lỗi vẫn ném ra để Next giữ lại trang cũ.
export async function orFallbackAtBuild<T>(task: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") return fallback;
    throw error;
  }
}
