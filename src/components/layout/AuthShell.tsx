import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { BellIcon, BotIcon, ShieldCheckIcon } from "@/components/ui/icons";
import styles from "./AuthShell.module.css";

const HIGHLIGHTS = [
  { Icon: BotIcon, text: "Trợ lý AI gợi ý sản phẩm theo nhu cầu và ngân sách" },
  { Icon: BellIcon, text: "Theo dõi giá, báo ngay khi sản phẩm giảm" },
  { Icon: ShieldCheckIcon, text: "Hàng chính hãng, bảo hành toàn quốc" },
] as const;

/** Khung 2 cột của các màn xác thực (Figma 05.01–05.08): sidebar giới thiệu + nội dung. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Giới thiệu NexTech">
        <div className={styles.intro}>
          <Logo height={45} priority />
          <p className={styles.slogan}>
            Mua công nghệ
            <br />
            <span className={styles.sloganAccent}>thông minh hơn</span>
          </p>
          <ul className={styles.highlights}>
            {HIGHLIGHTS.map(({ Icon, text }) => (
              <li key={text}>
                <span className={styles.highlightIcon}>
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
