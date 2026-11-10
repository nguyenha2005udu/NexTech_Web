import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  CpuIcon,
  DeviceCardIcon,
  HeadphonesIcon,
  KeyboardIcon,
  LaptopIcon,
  MonitorIcon,
  NetworkIcon,
  ShieldCheckIcon,
  SparkleLargeIcon,
  StorageIcon,
  ZapIcon,
  BellIcon,
} from "@/components/ui/icons";
import { routes } from "@/config/routes";
import type { Category, CategoryIconKey } from "@/entities/category";
import styles from "./Home.module.css";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

// Khối "Cam kết mua sắm" (Figma 01.01)
const COMMITMENTS: ReadonlyArray<{ Icon: Icon; title: string; desc: string }> = [
  { Icon: ZapIcon, title: "Giao hàng hỏa tốc", desc: "Nội thành trong 2 giờ" },
  { Icon: ShieldCheckIcon, title: "Chính hãng 100%", desc: "Bảo hành toàn quốc" },
  { Icon: BellIcon, title: "Theo dõi giá", desc: "Báo ngay khi giảm" },
  { Icon: HeadphonesIcon, title: "Hỗ trợ 24/7", desc: "Tư vấn tận tâm" },
];

export function CommitmentStrip() {
  return (
    <section className={styles.commitments} aria-label="Cam kết mua sắm">
      {COMMITMENTS.map(({ Icon, title, desc }) => (
        <div key={title} className={styles.commitment}>
          <span className={styles.commitmentIcon}>
            <Icon />
          </span>
          <div>
            <p className={styles.commitmentTitle}>{title}</p>
            <p className={styles.commitmentDesc}>{desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

const CATEGORY_ICONS: Record<CategoryIconKey, Icon> = {
  laptop: LaptopIcon,
  monitor: MonitorIcon,
  keyboard: KeyboardIcon,
  cpu: CpuIcon,
  device: DeviceCardIcon,
  sparkle: SparkleLargeIcon,
  storage: StorageIcon,
  network: NetworkIcon,
};

// FDD 2.1 — "Danh mục nổi bật"
export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <ul className={styles.categoryGrid}>
      {categories.map((c) => {
        const Icon = CATEGORY_ICONS[c.icon];
        return (
          <li key={c.id}>
            <Link href={routes.category(c.slug)} className={styles.categoryItem}>
              <span className={styles.categoryIcon}>
                <Icon />
              </span>
              {c.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
