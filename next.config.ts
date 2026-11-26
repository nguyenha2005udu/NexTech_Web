import type { NextConfig } from "next";

const apiBaseUrl = process.env.API_BASE_URL;

const nextConfig: NextConfig = {
  devIndicators: false,
  // Ảnh sản phẩm do backend lưu trên Cloudinary (next/image cần khai báo host ngoài).
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  experimental: {
    serverActions: {
      // Upload ảnh sản phẩm qua Server Action (FDD 7.2): backend nhận tối đa 5MB, Next mặc định chỉ 1MB.
      // Dư 1MB cho phần multipart bao quanh file.
      bodySizeLimit: "6mb",
    },
  },
  // Đăng nhập Google/Facebook (FDD 1.1.3–1.1.4): trình duyệt đi qua đường dẫn của web, Next chuyển tiếp
  // sang API Gateway. Backend chạy OAuth và ghi cookie phiên.
  async rewrites() {
    if (!apiBaseUrl) return [];
    return [
      { source: "/api/auth/:provider(google|facebook)", destination: `${apiBaseUrl}/api/auth/:provider` },
      {
        source: "/api/auth/:provider(google|facebook)/callback",
        destination: `${apiBaseUrl}/api/auth/:provider/callback`,
      },
    ];
  },
};

export default nextConfig;
