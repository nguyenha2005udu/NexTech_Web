import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";

// Logo raster xuất từ Figma (Image (NexTech)), ảnh gốc 754 × 200.
const RATIO = 754 / 200;

type LogoProps = { height?: number; priority?: boolean; className?: string };

export function Logo({ height = 35, priority = false, className }: LogoProps) {
  return (
    <Link href={routes.home} className={className} aria-label="NexTech — về trang chủ">
      <Image
        src="/images/brand/nextech-logo.png"
        alt="NexTech"
        width={Math.round(height * RATIO)}
        height={height}
        priority={priority}
      />
    </Link>
  );
}
