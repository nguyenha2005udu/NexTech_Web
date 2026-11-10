import Link from "next/link";
import { ArrowRightIcon, BellIcon, SparkleSmallIcon, StarFilledIcon } from "@/components/ui/icons";
import { routes } from "@/config/routes";
import styles from "./Home.module.css";

// FDD 2.1 — Hero "trống đồng Đông Sơn" (Figma 01.01)
const STATS = [
  { value: "10K+", label: "Sản phẩm" },
  { value: "50K+", label: "Khách hàng" },
  { value: "4.8", label: "Đánh giá", star: true },
] as const;

export function HomeHero({ exploreHref }: { exploreHref: string }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroDrum} aria-hidden="true" />
      <div className={styles.heroContent}>
        <span className={styles.heroBadge}>
          <SparkleSmallIcon /> Trợ lý mua sắm đồ điện tử
        </span>
        <h1 id="hero-title" className={styles.heroTitle}>
          Công nghệ <span className={styles.heroAccent}>thế hệ mới</span>
        </h1>
        <p className={styles.heroLead}>
          Laptop, điện thoại, thiết bị thông minh — chính hãng, giá tốt, kèm trợ lý AI gợi ý sản phẩm và theo dõi giảm
          giá tự động.
        </p>
        <div className={styles.heroActions}>
          <Link href={exploreHref} className={styles.heroPrimary}>
            Khám phá ngay <ArrowRightIcon />
          </Link>
          <Link href={routes.priceAlerts} className={styles.heroSecondary}>
            <BellIcon /> Theo dõi giá
          </Link>
        </div>
        <dl className={styles.heroStats}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.heroStat}>
              <dt className="sr-only">{s.label}</dt>
              <dd className={styles.heroStatValue}>
                {s.value}
                {"star" in s ? <StarFilledIcon /> : null}
              </dd>
              <dd className={styles.heroStatLabel} aria-hidden="true">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
