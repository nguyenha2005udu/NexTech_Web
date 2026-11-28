import type { ReactNode } from "react";
import { AssistantLauncher } from "@/components/layout/AssistantLauncher";
import { HeaderSwitch } from "@/components/layout/HeaderSwitch";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { MainHeader } from "@/components/layout/MainHeader";
import { StorefrontFooter } from "@/components/layout/StorefrontFooter";
import { CartPersistence } from "@/features/cart";
import styles from "./layout.module.css";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className={styles.shell}>
      <HeaderSwitch home={<HomeHeader />} inner={<MainHeader />} />
      <div className={styles.content}>{children}</div>
      <StorefrontFooter />
      <AssistantLauncher />
      {/* FDD 4.1 — nạp/lưu giỏ của khách ở localStorage */}
      <CartPersistence />
    </div>
  );
}
