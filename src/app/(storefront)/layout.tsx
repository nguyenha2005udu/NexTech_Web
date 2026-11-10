import type { ReactNode } from "react";
import { AssistantLauncher } from "@/components/layout/AssistantLauncher";
import { HeaderSwitch } from "@/components/layout/HeaderSwitch";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { MainHeader } from "@/components/layout/MainHeader";
import { StorefrontFooter } from "@/components/layout/StorefrontFooter";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <HeaderSwitch home={<HomeHeader />} inner={<MainHeader />} />
      {children}
      <StorefrontFooter />
      <AssistantLauncher />
    </>
  );
}
