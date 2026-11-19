import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { colors } from "@/config/theme";
import { siteConfig } from "@/config/site";

// Ảnh chia sẻ mạng xã hội (mục 11) — khung dùng chung cho opengraph-image.tsx của các route.

export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * Đọc ảnh trong public/ thành data URI. ImageResponse (Satori) không tải được đường dẫn
 * tương đối, còn gọi http tới chính site lúc build thì server chưa chạy.
 */
export async function publicImageDataUri(src: string): Promise<string | null> {
  if (!src.startsWith("/")) return null;
  const mime = src.endsWith(".svg") ? "image/svg+xml" : src.endsWith(".png") ? "image/png" : null;
  if (!mime) return null;
  try {
    const file = await readFile(join(process.cwd(), "public", src));
    return `data:${mime};base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

type OgCardProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Dòng nhấn (giá, số sản phẩm…) */
  highlight?: string;
  imageDataUri?: string | null;
};

export function OgCard({ eyebrow, title, subtitle, highlight, imageDataUri }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: colors.ink,
        color: "#ffffff",
        padding: 64,
        gap: 48,
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
          <span style={{ color: "#ff8a4c" }}>N</span>
          <span style={{ marginLeft: 14 }}>Nex</span>
          <span style={{ color: "#ff8a4c" }}>Tech</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 26, color: "#ffad80", textTransform: "uppercase", letterSpacing: 2 }}>{eyebrow}</span>
          <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{title}</span>
          {subtitle ? <span style={{ fontSize: 28, color: "#c9cdd8", lineHeight: 1.4 }}>{subtitle}</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {highlight ? (
            <span
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: "#ffffff",
                background: colors.primary,
                borderRadius: 16,
                padding: "10px 24px",
              }}
            >
              {highlight}
            </span>
          ) : (
            <span />
          )}
          <span style={{ fontSize: 24, color: "#c9cdd8" }}>{new URL(siteConfig.url).host}</span>
        </div>
      </div>
      {imageDataUri ? (
        <div
          style={{
            width: 440,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: colors.surfaceMuted,
            borderRadius: 32,
          }}
        >
          {/* Satori chỉ hiểu <img>, next/image không dùng được trong ImageResponse */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageDataUri} alt="" width={400} height={229} />
        </div>
      ) : null}
    </div>
  );
}
